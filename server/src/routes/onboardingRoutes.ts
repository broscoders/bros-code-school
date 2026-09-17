import { Router } from "express";
import {
  registerOrganization,
  getOnboardingStatus,
  updateOnboardingOrganization,
  updateOnboardingBranch,
  completeOnboarding,
} from "../controllers/onboardingController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { loginLimiter } from "../middleware/rateLimiters";

const router = Router();

// Public - this is the entry point for a brand new organization signing
// up, so there's no token yet.
router.post("/register", loginLimiter, registerOrganization);

// The rest are the setup-wizard steps, only meaningful for the admin who
// just registered (or logged into an org that never finished setup).
router.get("/status", protect, requireRole("SCHOOL_ADMIN"), getOnboardingStatus);
router.put("/organization", protect, requireRole("SCHOOL_ADMIN"), updateOnboardingOrganization);
router.put("/branch", protect, requireRole("SCHOOL_ADMIN"), updateOnboardingBranch);
router.post("/complete", protect, requireRole("SCHOOL_ADMIN"), completeOnboarding);

export default router;
