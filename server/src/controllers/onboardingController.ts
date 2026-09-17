import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/authMiddleware";
import Organization from "../models/Organization";
import School from "../models/School";
import User from "../models/User";
import { isNonEmptyString } from "../utils/validateStrings";
import { sendMail, generateSixDigitCode, verificationEmailHtml } from "../utils/mailer";

const CODE_EXPIRY_MS = 15 * 60 * 1000;

// Blueprint 3 (Onboarding): Registration -> Verification -> Organization
// creation -> Main administrator creation, all as one step from the
// registering person's point of view. Everything after this (branch
// setup, academic setup, user setup, import, final review) happens
// inside the app once they've verified their email and logged in - see
// getOnboardingStatus/completeOnboarding below.
export const registerOrganization = async (req: Request, res: Response) => {
  try {
    const { organizationName, organizationType, ownerName, ownerEmail, ownerPhone, country, city, approxStudents, password } = req.body;

    if (!isNonEmptyString(organizationName) || !isNonEmptyString(ownerName) || !isNonEmptyString(ownerEmail) || !isNonEmptyString(password)) {
      return res.status(400).json({ message: "Organization name, your name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = ownerEmail.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists. Try logging in instead." });
    }

    const validTypes = ["SCHOOL", "ACADEMY", "COLLEGE", "INSTITUTE", "TRAINING_CENTER", "TUITION_CENTER", "EDUCATION_NETWORK", "OTHER"];
    const type = validTypes.includes(organizationType) ? organizationType : "SCHOOL";

    const organization = await Organization.create({
      name: organizationName,
      type,
      ownerName,
      ownerEmail: normalizedEmail,
      ownerPhone,
      country,
      city,
      approxStudents: approxStudents ? Number(approxStudents) : undefined,
      status: "PENDING",
      subscriptionStatus: "TRIAL",
      onboardingCompleted: false,
    });

    // The main branch - Blueprint 2/16 treats "branch" as just another
    // School document under the Organization, so registering creates the
    // organization's first (main) branch immediately rather than leaving
    // it in a state with no school for the admin to actually belong to.
    const school = await School.create({
      organizationId: organization._id,
      name: organizationName,
      contactEmail: normalizedEmail,
      contactPhone: ownerPhone,
      isActive: false, // flips true in completeOnboarding, once set up
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateSixDigitCode();
    const adminUser = await User.create({
      name: ownerName,
      email: normalizedEmail,
      password: hashedPassword,
      role: "SCHOOL_ADMIN",
      schoolId: school._id,
      isEmailVerified: false,
      mustChangePassword: false,
      verificationCode: code,
      verificationCodeExpires: new Date(Date.now() + CODE_EXPIRY_MS),
    });

    await sendMail(normalizedEmail, "Verify your email", verificationEmailHtml(ownerName, code), school._id.toString());

    res.status(201).json({
      message: "Organization registered. Check your email for a verification code to activate your admin account.",
      email: adminUser.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// After verifying email and logging in (the existing /auth/verify-email
// and /auth/login flows both already work unchanged for this account -
// nothing onboarding-specific needed there), the client calls this to
// find out whether to show the setup wizard or go straight to the normal
// dashboard, and to pre-fill the wizard with what's already known.
export const getOnboardingStatus = async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findById(req.user!.schoolId);
    if (!school) return res.status(404).json({ message: "School not found" });

    const organization = school.organizationId ? await Organization.findById(school.organizationId) : null;

    res.json({
      organization,
      school,
      // No organizationId (a school created before Organization existed)
      // or already-completed onboarding both mean: nothing to do here.
      onboardingCompleted: !organization || organization.onboardingCompleted,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateOnboardingOrganization = async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findById(req.user!.schoolId);
    if (!school?.organizationId) return res.status(404).json({ message: "Organization not found" });

    const { logoUrl, address, academicModel } = req.body;
    const organization = await Organization.findByIdAndUpdate(
      school.organizationId,
      { ...(logoUrl && { logoUrl }), ...(address && { address }) },
      { new: true }
    );

    // academicModel (School vs Academy structure) isn't a stored field
    // yet on either model - kept here as a no-op placeholder rather than
    // silently dropping it, so the wizard step doesn't error out even
    // though nothing persists it today.
    void academicModel;

    res.json(organization);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateOnboardingBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, contactPhone, logoUrl, primaryColor, secondaryColor } = req.body;
    const school = await School.findByIdAndUpdate(
      req.user!.schoolId,
      { ...(name && { name }), ...(address && { address }), ...(contactPhone && { contactPhone }), ...(logoUrl && { logoUrl }), ...(primaryColor && { primaryColor }), ...(secondaryColor && { secondaryColor }) },
      { new: true }
    );
    if (!school) return res.status(404).json({ message: "School not found" });
    res.json(school);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint 3: "Allow administrators to skip optional setup and complete
// it later" - so this can be called even if academic/user-setup steps
// were skipped. It's the "Final review -> Activate organization" step:
// flips the school live and marks the organization as no longer pending.
export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const school = await School.findByIdAndUpdate(req.user!.schoolId, { isActive: true }, { new: true });
    if (!school) return res.status(404).json({ message: "School not found" });

    if (school.organizationId) {
      await Organization.findByIdAndUpdate(school.organizationId, { onboardingCompleted: true, status: "ACTIVE" });
    }

    res.json({ message: "Setup complete. Welcome aboard!" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
