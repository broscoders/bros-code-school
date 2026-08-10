import { Router } from "express";
import { createSchool, getSchools, getSchoolById, updateSchool } from "../controllers/schoolController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/", createSchool);
router.get("/", getSchools);
router.get("/:id", getSchoolById);
router.put("/:id", protect, requireRole("SCHOOL_ADMIN", "PRINCIPAL"), updateSchool);

export default router;
