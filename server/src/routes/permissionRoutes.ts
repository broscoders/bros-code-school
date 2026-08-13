import { Router } from "express";
import { getPermissions, updatePermission, createCustomRole, getModuleList } from "../controllers/permissionController";

const router = Router();

router.get("/", getPermissions);
router.get("/modules", getModuleList);
router.put("/:id", updatePermission);
router.post("/custom-role", createCustomRole);

export default router;
