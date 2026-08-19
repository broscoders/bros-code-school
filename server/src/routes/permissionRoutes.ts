import { Router } from "express";
import { getPermissions, updatePermission, createCustomRole, getModuleList } from "../controllers/permissionController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TOP_ADMIN } from "../middleware/permissions";

const router = Router();

router.get("/", protect, requireRole(...TOP_ADMIN), getPermissions);
router.get("/modules", protect, requireRole(...TOP_ADMIN), getModuleList);
router.put("/:id", protect, requireRole(...TOP_ADMIN), updatePermission);
router.post("/custom-role", protect, requireRole(...TOP_ADMIN), createCustomRole);

export default router;
