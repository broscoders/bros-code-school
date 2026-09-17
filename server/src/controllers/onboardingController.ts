import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Organization from "../models/Organization";
import School from "../models/School";

// Blueprint 3 (Onboarding): the guided setup wizard. New organizations
// are only ever created by a Platform Admin (organizationController.
// createOrganization) - there is no public self-registration, same as an
// institution handing out an email/password rather than letting anyone
// sign up. What follows is what that newly-created SCHOOL_ADMIN sees on
// their first login.

// After logging in for the first time (Login.tsx sends every SCHOOL_ADMIN
// through /onboarding), the client calls this to find out whether to show
// the setup wizard or go straight to the normal dashboard, and to
// pre-fill the wizard with what's already known.
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
