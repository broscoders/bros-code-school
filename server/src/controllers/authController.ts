import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import { OAuth2Client } from "google-auth-library";
import type { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Session from "../models/Session";
import { generateToken } from "../utils/generateToken";
import { getJwtSecret } from "../utils/jwtSecret";
import { isNonEmptyString } from "../utils/validateStrings";
import { checkOrgLimit } from "../utils/orgLimits";
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
const TWO_FACTOR_PENDING_EXPIRY = "5m";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Shared by every place that hands someone a fresh token (register-verify,
// password login, Google login): signs the JWT and records the matching
// Session row in one place so the two can never drift out of sync.
async function issueSessionToken(req: Request, userId: string, role: string, schoolId: string): Promise<string> {
  const { token, jti } = generateToken(userId, role, schoolId);
  await Session.create({
    userId,
    jti,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  return token;
}

export const registerUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const schoolId = req.user!.schoolId;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Invalid email or password format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (role === "STUDENT" || role === "TEACHER") {
      const limitCheck = await checkOrgLimit(schoolId, role);
      if (!limitCheck.allowed) {
        return res.status(403).json({ message: limitCheck.message });
      }
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
      mustChangePassword: true,
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
    if (!isNonEmptyString(email) || !isNonEmptyString(code)) {
      return res.status(400).json({ message: "Invalid email or code format" });
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

    const token = await issueSessionToken(req, user.id.toString(), user.role, user.schoolId.toString());

    res.json({
      message: "Email verified",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        mustChangePassword: user.mustChangePassword,
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
    if (!isNonEmptyString(email)) {
      return res.status(400).json({ message: "Invalid email format" });
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
    if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
      return res.status(401).json({ message: "Invalid email or password" });
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

    if (user.accountStatus === "SUSPENDED") {
      return res.status(403).json({ message: "This account has been suspended. Please contact your school administrator." });
    }
    if (user.accountStatus === "ARCHIVED") {
      return res.status(403).json({ message: "This account is no longer active. Please contact your school administrator." });
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

    // Blueprint 73 (Security): password alone isn't enough once 2FA is
    // turned on for this account - hand back a short-lived pending token
    // instead of a real session token. The real token only gets issued
    // from verifyTwoFactorLogin once the TOTP/backup code checks out.
    if (user.twoFactorEnabled) {
      const pendingToken = jwt.sign({ userId: user.id.toString(), purpose: "2fa-pending" }, getJwtSecret(), {
        expiresIn: TWO_FACTOR_PENDING_EXPIRY,
      });
      return res.json({ requiresTwoFactor: true, pendingToken });
    }

    const token = await issueSessionToken(req, user.id.toString(), user.role, user.schoolId.toString());

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        mustChangePassword: user.mustChangePassword,
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

    if (user.accountStatus === "SUSPENDED") {
      return res.status(403).json({ message: "This account has been suspended. Please contact your school administrator." });
    }
    if (user.accountStatus === "ARCHIVED") {
      return res.status(403).json({ message: "This account is no longer active. Please contact your school administrator." });
    }

    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
    }
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = await issueSessionToken(req, user.id.toString(), user.role, user.schoolId.toString());

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Google sign-in failed", error: (err as Error).message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (!isNonEmptyString(currentPassword) || !isNonEmptyString(newPassword)) {
      return res.status(400).json({ message: "Invalid password format" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user!.userId).select("+password");
    if (!user) return res.status(404).json({ message: "Account not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!isNonEmptyString(email)) {
      return res.json({ message: "If that email is registered, a reset code has been sent." });
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
    if (!isNonEmptyString(email) || !isNonEmptyString(code) || !isNonEmptyString(newPassword)) {
      return res.status(400).json({ message: "Invalid request format" });
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
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: "Password reset. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint 10 (Session Management): "Users should be able to see their
// active sessions where appropriate" + "Logout from other sessions".
export const getMySessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await Session.find({ userId: req.user!.userId, revoked: false }).sort({ lastSeenAt: -1 });
    res.json(
      sessions.map((s) => ({
        id: s._id,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        lastSeenAt: s.lastSeenAt,
        isCurrent: s.jti === req.user!.jti,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const revokeSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!session) return res.status(404).json({ message: "Session not found" });
    session.revoked = true;
    session.revokedAt = new Date();
    await session.save();
    res.json({ message: "Session revoked" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// "Logout from other sessions" - keeps the device the person is using
// right now logged in, kills every other one (lost phone, shared/public
// computer they forgot to log out of, etc.).
export const logoutOtherSessions = async (req: AuthRequest, res: Response) => {
  try {
    await Session.updateMany(
      { userId: req.user!.userId, jti: { $ne: req.user!.jti }, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );
    res.json({ message: "Logged out of all other sessions" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Revokes the session tied to the token making this request, so "log out"
// actually invalidates the token server-side instead of just deleting it
// client-side (which left it usable by anyone who'd copied it until it
// expired on its own after 7 days).
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.jti) {
      await Session.updateOne({ jti: req.user.jti }, { revoked: true, revokedAt: new Date() });
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// ---- Two-Factor Authentication (Blueprint 73: Security) ----
// TOTP (Google Authenticator / Authy compatible) with one-time backup
// codes, no external service/API key required.

function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () => crypto.randomBytes(5).toString("hex").toUpperCase());
}

// Step 1: generate (or regenerate, if the person abandoned setup last
// time) a secret and hand back a QR code. Not enabled yet - that only
// happens once verifyTwoFactorSetup confirms they actually scanned it.
export const setupTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: "Two-factor authentication is already enabled" });
    }

    const secret = authenticator.generateSecret();
    user.twoFactorSecret = secret;
    await user.save();

    const otpauthUrl = authenticator.keyuri(user.email, "Bros Code School", secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    res.json({ secret, qrCodeDataUrl });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Step 2: person enters the 6-digit code their authenticator app is
// showing, proving the secret was actually scanned/entered correctly.
export const verifyTwoFactorSetup = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.body;
    if (!isNonEmptyString(code)) return res.status(400).json({ message: "Code is required" });

    const user = await User.findById(req.user!.userId).select("+twoFactorSecret");
    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ message: "Start setup first" });
    }

    const isValid = authenticator.check(code, user.twoFactorSecret);
    if (!isValid) return res.status(400).json({ message: "Invalid code, please try again" });

    const backupCodes = generateBackupCodes();
    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 10)));
    await user.save();

    // Backup codes are only ever shown once, in plaintext, right here -
    // after this they only exist as hashes, same as the password.
    res.json({ message: "Two-factor authentication enabled", backupCodes });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const disableTwoFactor = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;
    if (!isNonEmptyString(password)) return res.status(400).json({ message: "Password is required" });

    const user = await User.findById(req.user!.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save();

    res.json({ message: "Two-factor authentication disabled" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Step from loginUser once it returned { requiresTwoFactor: true,
// pendingToken }: exchanges a valid TOTP code (or one-time backup code)
// for a real session token, same as a normal login would issue.
export const verifyTwoFactorLogin = async (req: Request, res: Response) => {
  try {
    const { pendingToken, code } = req.body;
    if (!isNonEmptyString(pendingToken) || !isNonEmptyString(code)) {
      return res.status(400).json({ message: "Pending token and code are required" });
    }

    let decoded: { userId: string; purpose: string };
    try {
      decoded = jwt.verify(pendingToken, getJwtSecret()) as { userId: string; purpose: string };
    } catch {
      return res.status(401).json({ message: "This login attempt has expired. Please log in again." });
    }
    if (decoded.purpose !== "2fa-pending") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.userId).select("+twoFactorSecret +twoFactorBackupCodes");
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ message: "Two-factor authentication is not enabled for this account" });
    }

    if (user.accountStatus !== "ACTIVE") {
      return res.status(403).json({ message: "This account is not active. Please contact your school administrator." });
    }

    let verified = authenticator.check(code, user.twoFactorSecret);
    let usedBackupIndex = -1;

    if (!verified && user.twoFactorBackupCodes?.length) {
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        if (await bcrypt.compare(code.toUpperCase(), user.twoFactorBackupCodes[i])) {
          verified = true;
          usedBackupIndex = i;
          break;
        }
      }
    }

    if (!verified) return res.status(401).json({ message: "Invalid code" });

    // A backup code only works once - remove it the moment it's used.
    if (usedBackupIndex >= 0) {
      user.twoFactorBackupCodes!.splice(usedBackupIndex, 1);
      await user.save();
    }

    const token = await issueSessionToken(req, user.id.toString(), user.role, user.schoolId.toString());

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        mustChangePassword: user.mustChangePassword,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};