import { Router } from "express";
import {
  createAnnouncement, getAnnouncements,
  createAdmission, getAdmissions, updateAdmissionStatus,
  sendMessage, getMessages,
  createAcademyProgram, getAcademyPrograms,
  createAcademyBatch, getAcademyBatches,
  enrollInAcademy, getAcademyEnrollments,
} from "../controllers/extraController";

const router = Router();

router.post("/announcements", createAnnouncement);
router.get("/announcements", getAnnouncements);

router.post("/admissions", createAdmission);
router.get("/admissions", getAdmissions);
router.put("/admissions/:id/status", updateAdmissionStatus);

router.post("/messages", sendMessage);
router.get("/messages", getMessages);

router.post("/academy/programs", createAcademyProgram);
router.get("/academy/programs", getAcademyPrograms);

router.post("/academy/batches", createAcademyBatch);
router.get("/academy/batches", getAcademyBatches);

router.post("/academy/enroll", enrollInAcademy);
router.get("/academy/enrollments", getAcademyEnrollments);

export default router;
