import { Router } from "express";
import { createAdmission, getAdmissions, updateAdmissionStatus, convertAdmissionToStudent } from "../controllers/admissionController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ADMISSIONS_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...ADMISSIONS_STAFF), createAdmission);
router.get("/", protect, requireRole(...ADMISSIONS_STAFF), getAdmissions);
router.put("/:id/status", protect, requireRole(...ADMISSIONS_STAFF), updateAdmissionStatus);
router.post("/:id/convert", protect, requireRole(...ADMISSIONS_STAFF), convertAdmissionToStudent);

export default router;