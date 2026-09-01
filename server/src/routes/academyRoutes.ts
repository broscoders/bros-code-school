import { Router } from "express";
import {
  createAcademyProgram, getAcademyPrograms,
  createAcademyBatch, getAcademyBatches, getMyAcademyBatches, getBatchStudents, setAcademyBatchStatus,
  enrollInAcademy, getAcademyEnrollments,
} from "../controllers/academyController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMY_STAFF, EVERYONE, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/programs", protect, requireRole(...ACADEMY_STAFF), createAcademyProgram);
router.get("/programs", protect, requireRole(...EVERYONE), getAcademyPrograms);

router.post("/batches", protect, requireRole(...ACADEMY_STAFF), createAcademyBatch);
router.get("/batches", protect, requireRole(...EVERYONE), getAcademyBatches);
router.get("/batches/mine", protect, requireRole(...EVERYONE), getMyAcademyBatches);
router.get("/batches/:batchId/students", protect, requireRole(...EVERYONE), getBatchStudents);
router.put("/batches/:id/status", protect, requireRole(...ACADEMY_STAFF), setAcademyBatchStatus);

router.post("/enroll", protect, requireRole(ROLES.PARENT, ROLES.STUDENT, ...ACADEMY_STAFF), enrollInAcademy);
router.get("/enrollments", protect, requireRole(...EVERYONE), getAcademyEnrollments);

export default router;
