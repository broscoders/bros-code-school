import { Router } from "express";
import { platformLogin } from "../controllers/platformAuthController";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  setOrganizationStatus,
  setOrganizationPlan,
  getOrganizationUsage,
  addBranch,
  getPlatformStats,
} from "../controllers/organizationController";
import { protectPlatform, requirePlatformRole } from "../middleware/platformAuthMiddleware";

const router = Router();

router.post("/auth/login", platformLogin);

router.get("/stats", protectPlatform, requirePlatformRole("SUPER_ADMIN", "SUPPORT_STAFF", "ACCOUNT_MANAGER"), getPlatformStats);

router.post("/organizations", protectPlatform, requirePlatformRole("SUPER_ADMIN"), createOrganization);
router.get("/organizations", protectPlatform, requirePlatformRole("SUPER_ADMIN", "SUPPORT_STAFF", "ACCOUNT_MANAGER"), getOrganizations);
router.get("/organizations/:id", protectPlatform, requirePlatformRole("SUPER_ADMIN", "SUPPORT_STAFF", "ACCOUNT_MANAGER"), getOrganizationById);
router.put("/organizations/:id", protectPlatform, requirePlatformRole("SUPER_ADMIN"), updateOrganization);
router.put("/organizations/:id/status", protectPlatform, requirePlatformRole("SUPER_ADMIN"), setOrganizationStatus);
router.put("/organizations/:id/plan", protectPlatform, requirePlatformRole("SUPER_ADMIN"), setOrganizationPlan);
router.get("/organizations/:id/usage", protectPlatform, requirePlatformRole("SUPER_ADMIN", "SUPPORT_STAFF", "ACCOUNT_MANAGER"), getOrganizationUsage);
router.post("/organizations/:id/branches", protectPlatform, requirePlatformRole("SUPER_ADMIN"), addBranch);

export default router;
