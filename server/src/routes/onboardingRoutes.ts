import { Router } from "express";
import {
  getOnboardingStatus,
  updateOnboardingOrganization,
  updateOnboardingBranch,
  completeOnboarding,
} from "../controllers/onboardingController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

// No public self-registration - new organizations are only ever created
// by a Platform Admin (see organizationController.createOrganization),
// same as a university handing out an institutional email/password
// rather than letting anyone sign up. The wizard steps below are what
// that newly-created SCHOOL_ADMIN sees on their first login.
router.get("/status", protect, requireRole("SCHOOL_ADMIN"), getOnboardingStatus);
router.put("/organization", protect, requireRole("SCHOOL_ADMIN"), updateOnboardingOrganization);
router.put("/branch", protect, requireRole("SCHOOL_ADMIN"), updateOnboardingBranch);
router.post("/complete", protect, requireRole("SCHOOL_ADMIN"), completeOnboarding);

export default router;
