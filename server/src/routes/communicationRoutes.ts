import { Router } from "express";
import {
  sendMessage, getThread, getInbox, setCommunicationHours,
  createPTMSlot, getPTMSlotsByTeacher, getAllTeacherSlots, bookPTMSlot,
  createLeaveRequest, getLeaveRequests, updateLeaveStatus,
  addStudyMaterial, getStudyMaterial,
} from "../controllers/communicationController";

const router = Router();

router.post("/messages", sendMessage);
router.get("/messages/thread", getThread);
router.get("/messages/inbox", getInbox);

router.put("/teachers/:id/communication-hours", setCommunicationHours);

router.post("/ptm-slots", createPTMSlot);
router.get("/ptm-slots/by-teacher", getPTMSlotsByTeacher);
router.get("/ptm-slots/available", getAllTeacherSlots);
router.put("/ptm-slots/:id/book", bookPTMSlot);

router.post("/leave-requests", createLeaveRequest);
router.get("/leave-requests", getLeaveRequests);
router.put("/leave-requests/:id/status", updateLeaveStatus);

router.post("/study-material", addStudyMaterial);
router.get("/study-material", getStudyMaterial);

export default router;
