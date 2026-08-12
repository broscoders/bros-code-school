import { Router } from "express";
import {
  createAnnouncement, getAnnouncements,
  createAdmission, getAdmissions, updateAdmissionStatus,
  sendMessage, getMessages,
  createAcademyProgram, getAcademyPrograms,
  createAcademyBatch, getAcademyBatches,
  enrollInAcademy, getAcademyEnrollments,
} from "../controllers/extraController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMIC_STAFF, ADMISSIONS_STAFF, ACADEMY_STAFF, EVERYONE, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/announcements", protect, requireRole(...ACADEMIC_STAFF), createAnnouncement);
router.get("/announcements", protect, requireRole(...EVERYONE), getAnnouncements);

router.post("/admissions", protect, requireRole(...ADMISSIONS_STAFF), createAdmission);
router.get("/admissions", protect, requireRole(...ADMISSIONS_STAFF), getAdmissions);
router.put("/admissions/:id/status", protect, requireRole(...ADMISSIONS_STAFF), updateAdmissionStatus);

router.post("/messages", protect, requireRole(...EVERYONE), sendMessage);
router.get("/messages", protect, requireRole(...EVERYONE), getMessages);

router.post("/academy/programs", protect, requireRole(...ACADEMY_STAFF), createAcademyProgram);
router.get("/academy/programs", protect, requireRole(...EVERYONE), getAcademyPrograms);

router.post("/academy/batches", protect, requireRole(...ACADEMY_STAFF), createAcademyBatch);
router.get("/academy/batches", protect, requireRole(...EVERYONE), getAcademyBatches);

router.post("/academy/enroll", protect, requireRole(ROLES.PARENT, ROLES.STUDENT, ...ACADEMY_STAFF), enrollInAcademy);
router.get("/academy/enrollments", protect, requireRole(...EVERYONE), getAcademyEnrollments);

export default router;
