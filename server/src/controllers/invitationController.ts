import type { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/authMiddleware";
import Invitation from "../models/Invitation";
import User from "../models/User";
import type { UserRole } from "../models/User";
import School from "../models/School";
import { isNonEmptyString } from "../utils/validateStrings";
import { checkOrgLimit } from "../utils/orgLimits";
import { logAudit } from "../utils/auditLogger";
import { sendMail, invitationEmailHtml } from "../utils/mailer";

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, per Blueprint 9

const VALID_ROLES: UserRole[] = [
  "SCHOOL_ADMIN",
  "PRINCIPAL",
  "HEAD",
  "ADMISSION_STAFF",
  "ACADEMIC_COORDINATOR",
  "ACCOUNTANT",
  "RECEPTIONIST",
  "LIBRARIAN",
  "TRANSPORT_MANAGER",
  "NURSE",
  "HOSTEL_WARDEN",
  "TEACHER",
  "ACADEMY_TEACHER",
  "PARENT",
  "STUDENT",
];

function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Any invitation whose expiry has passed is lazily flipped to EXPIRED the
// moment it's looked at (list, or lookup-by-token), rather than needing a
// cron job just to keep the status field honest.
async function expireStaleInvitations(filter: Record<string, unknown>) {
  await Invitation.updateMany(
    { ...filter, status: "PENDING", expiresAt: { $lt: new Date() } },
    { $set: { status: "EXPIRED" } }
  );
}

export const createInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, role, metadata } = req.body;
    if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(role)) {
      return res.status(400).json({ message: "Name, email and role are required" });
    }
    if (!VALID_ROLES.includes(role as UserRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const validRole = role as UserRole;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    await expireStaleInvitations({ schoolId: req.user!.schoolId });

    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    // Refresh an existing pending invite for the same email instead of
    // letting duplicates pile up in the list.
    let invitation = await Invitation.findOne({
      schoolId: req.user!.schoolId,
      email: normalizedEmail,
      status: "PENDING",
    });

    if (invitation) {
      invitation.name = name;
      invitation.role = validRole;
      invitation.token = token;
      invitation.expiresAt = expiresAt;
      invitation.metadata = metadata;
      await invitation.save();
    } else {
      invitation = await Invitation.create({
        schoolId: req.user!.schoolId,
        name,
        email: normalizedEmail,
        role: validRole,
        token,
        status: "PENDING",
        invitedByUserId: req.user!.userId,
        invitedByName: (req.body.invitedByName as string) || "Administrator",
        expiresAt,
        metadata,
      });
    }

    const school = await School.findById(req.user!.schoolId);
    const baseUrl = process.env.CLIENT_URL?.split(",")[0] || "";
    const inviteUrl = `${baseUrl}/accept-invite/${token}`;
    await sendMail(
      normalizedEmail,
      `Invitation to join ${school?.name || "your school"}`,
      invitationEmailHtml(name, inviteUrl, validRole, school?.name || "your school")
    );

    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: (req.body.invitedByName as string) || "Administrator",
      userRole: req.user!.role,
      action: `Invited ${normalizedEmail} as ${validRole}`,
      recordType: "Invitation",
      recordId: invitation._id.toString(),
      newValue: { email: normalizedEmail, role: validRole },
    });

    res.status(201).json(invitation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getInvitations = async (req: AuthRequest, res: Response) => {
  try {
    await expireStaleInvitations({ schoolId: req.user!.schoolId });
    const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };
    const status = req.query.status as string | undefined;
    if (status && status !== "ANY") filter.status = status;

    const invitations = await Invitation.find(filter).sort({ createdAt: -1 });
    res.json(invitations);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const resendInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const invitation = await Invitation.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    if (invitation.status === "ACCEPTED") {
      return res.status(400).json({ message: "This invitation has already been accepted" });
    }

    invitation.token = generateInviteToken();
    invitation.expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    invitation.status = "PENDING";
    await invitation.save();

    const school = await School.findById(req.user!.schoolId);
    const baseUrl = process.env.CLIENT_URL?.split(",")[0] || "";
    const inviteUrl = `${baseUrl}/accept-invite/${invitation.token}`;
    await sendMail(
      invitation.email,
      `Invitation to join ${school?.name || "your school"}`,
      invitationEmailHtml(invitation.name, inviteUrl, invitation.role, school?.name || "your school")
    );

    res.json(invitation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const revokeInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const invitation = await Invitation.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    if (invitation.status === "ACCEPTED") {
      return res.status(400).json({ message: "This invitation has already been accepted and cannot be revoked" });
    }

    invitation.status = "REVOKED";
    invitation.revokedAt = new Date();
    await invitation.save();

    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: (req.body.revokedByName as string) || "Administrator",
      userRole: req.user!.role,
      action: `Revoked invitation for ${invitation.email}`,
      recordType: "Invitation",
      recordId: invitation._id.toString(),
    });

    res.json(invitation);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Public endpoint - the invite link lands here before the person has any
// account, so no auth is possible yet. Only non-sensitive fields go back.
export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    await expireStaleInvitations({ token });

    const invitation = await Invitation.findOne({ token });
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });

    if (invitation.status === "ACCEPTED") {
      return res.status(400).json({ message: "This invitation has already been used" });
    }
    if (invitation.status === "REVOKED") {
      return res.status(400).json({ message: "This invitation has been revoked" });
    }
    if (invitation.status === "EXPIRED") {
      return res.status(400).json({ message: "This invitation has expired. Please ask your school to resend it." });
    }

    const school = await School.findById(invitation.schoolId);
    res.json({
      name: invitation.name,
      email: invitation.email,
      role: invitation.role,
      schoolName: school?.name || "your school",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!isNonEmptyString(token) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Token and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    await expireStaleInvitations({ token });
    const invitation = await Invitation.findOne({ token });
    if (!invitation) return res.status(404).json({ message: "Invitation not found" });
    if (invitation.status !== "PENDING") {
      return res.status(400).json({ message: "This invitation is no longer valid" });
    }

    // Someone could have registered this email a different way while the
    // invite was outstanding - don't silently create a second account.
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      invitation.status = "ACCEPTED";
      await invitation.save();
      return res.status(400).json({ message: "An account with this email already exists. Try logging in instead." });
    }

    if (invitation.role === "STUDENT" || invitation.role === "TEACHER") {
      const limitCheck = await checkOrgLimit(invitation.schoolId.toString(), invitation.role);
      if (!limitCheck.allowed) {
        return res.status(403).json({ message: limitCheck.message });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: invitation.name,
      email: invitation.email,
      password: hashedPassword,
      role: invitation.role,
      schoolId: invitation.schoolId,
      // The invite link itself, sent to the person's inbox, is the
      // verification step here - no separate email code needed.
      isEmailVerified: true,
      mustChangePassword: false,
    });

    invitation.status = "ACCEPTED";
    invitation.acceptedAt = new Date();
    await invitation.save();

    await logAudit({
      schoolId: invitation.schoolId.toString(),
      userId: user._id.toString(),
      userName: user.name,
      userRole: user.role,
      action: "Accepted invitation and created account",
      recordType: "Invitation",
      recordId: invitation._id.toString(),
    });

    res.status(201).json({
      message: "Account created successfully. You can now log in.",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
