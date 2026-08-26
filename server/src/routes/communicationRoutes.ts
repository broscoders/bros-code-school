import { Router } from "express";
import {
  sendMessage, getThread, getInbox, setCommunicationHours,
  createPTMSlot, getPTMSlotsByTeacher, getAllTeacherSlots, bookPTMSlot,
  createLeaveRequest, getLeaveRequests, updateLeaveStatus,
  addStudyMaterial, getStudyMaterial,
} from "../controllers/communicationController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TEACHING_STAFF, ACADEMIC_STAFF, EVERYONE, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/messages", protect, requireRole(...EVERYONE), sendMessage);
router.get("/messages/thread", protect, requireRole(...EVERYONE), getThread);
router.get("/messages/inbox", protect, requireRole(...EVERYONE), getInbox);

router.put("/teachers/:id/communication-hours", protect, requireRole(...TEACHING_STAFF), setCommunicationHours);

router.post("/ptm-slots", protect, requireRole(...TEACHING_STAFF), createPTMSlot);
router.get("/ptm-slots/by-teacher", protect, requireRole(...EVERYONE), getPTMSlotsByTeacher);
router.get("/ptm-slots/available", protect, requireRole(...EVERYONE), getAllTeacherSlots);
router.put("/ptm-slots/:id/book", protect, requireRole(ROLES.PARENT, ...TEACHING_STAFF), bookPTMSlot);

router.post("/leave-requests", protect, requireRole(...TEACHING_STAFF, ROLES.PARENT), createLeaveRequest);
router.get("/leave-requests", protect, requireRole(...ACADEMIC_STAFF), getLeaveRequests);
router.put("/leave-requests/:id/status", protect, requireRole(...ACADEMIC_STAFF), updateLeaveStatus);

router.post("/study-material", protect, requireRole(...TEACHING_STAFF), addStudyMaterial);
router.get("/study-material", protect, requireRole(...EVERYONE), getStudyMaterial);

export default router;
