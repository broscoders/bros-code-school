import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User";
import type { AuthRequest } from "../middleware/authMiddleware";
import { generateToken } from "../utils/generateToken";
import {
  sendMail,
  generateSixDigitCode,
  verificationEmailHtml,
  loginAlertEmailHtml,
  passwordResetEmailHtml,
} from "../utils/mailer";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const CODE_EXPIRY_MS = 15 * 60 * 1000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const schoolId = req.user!.schoolId;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateSixDigitCode();

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      schoolId,
      isEmailVerified: false,
      verificationCode: code,
      verificationCodeExpires: new Date(Date.now() + CODE_EXPIRY_MS),
    });

    await sendMail(email, "Verify your email", verificationEmailHtml(name, code));

    res.status(201).json({
      message: "Account created. Check your email for a verification code.",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email and code are required" });
    }

    const user = await User.findOne({ email }).select("+verificationCode +verificationCodeExpires");
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }
    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ message: "Incorrect code, try again" });
    }
    if (!user.verificationCodeExpires || user.verificationCodeExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "Code has expired, please request a new one" });
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    const token = generateToken(user.id.toString(), user.role, user.schoolId.toString());

    res.json({
      message: "Email verified",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const resendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const code = generateSixDigitCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + CODE_EXPIRY_MS);
    await user.save();

    await sendMail(email, "Verify your email", verificationEmailHtml(user.name, code));

    res.json({ message: "Verification code resent" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select(
      "+failedLoginAttempts +lockUntil +passwordResetCode +passwordResetExpires"
    );
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(423).json({
        message: "Too many failed attempts. Account locked for " + minutesLeft + " more minute(s). Check your email to reset your password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        const code = generateSixDigitCode();
        user.passwordResetCode = code;
        user.passwordResetExpires = new Date(Date.now() + CODE_EXPIRY_MS);
        user.failedLoginAttempts = 0;
        await user.save();

        await sendMail(user.email, "Multiple failed login attempts", loginAlertEmailHtml(user.name, code));

        return res.status(423).json({
          message: "Too many failed attempts. Your account has been locked for 15 minutes and a security code was emailed to you.",
        });
      }

      await user.save();
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        email: user.email,
        requiresVerification: true,
      });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = generateToken(user.id.toString(), user.role, user.schoolId.toString());

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Could not verify Google account" });
    }

    const user = await User.findOne({ email: payload.email }).select(
      "+failedLoginAttempts +lockUntil"
    );

    if (!user) {
      return res.status(404).json({
        message: "No account found with this email. Contact your school administrator.",
      });
    }

    if (!payload.email_verified) {
      return res.status(403).json({ message: "Your Google email is not verified" });
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
    }
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = generateToken(user.id.toString(), user.role, user.schoolId.toString());

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Google sign-in failed", error: (err as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (user) {
      const code = generateSixDigitCode();
      user.passwordResetCode = code;
      user.passwordResetExpires = new Date(Date.now() + CODE_EXPIRY_MS);
      await user.save();
      await sendMail(email, "Reset your password", passwordResetEmailHtml(user.name, code));
    }

    res.json({ message: "If that email is registered, a reset code has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Email, code and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email }).select("+passwordResetCode +passwordResetExpires");
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }
    if (!user.passwordResetCode || user.passwordResetCode !== code) {
      return res.status(400).json({ message: "Incorrect code, try again" });
    }
    if (!user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "Code has expired, please request a new one" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({ message: "Password reset. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};