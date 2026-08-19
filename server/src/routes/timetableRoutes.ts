import { Router } from "express";
import { upsertSlot, getClassTimetable, getTeacherTimetable, deleteSlot } from "../controllers/timetableController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMIC_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/slot", protect, requireRole(...ACADEMIC_STAFF), upsertSlot);
router.delete("/slot/:id", protect, requireRole(...ACADEMIC_STAFF), deleteSlot);
router.get("/class", protect, requireRole(...EVERYONE), getClassTimetable);
router.get("/teacher", protect, requireRole(...EVERYONE), getTeacherTimetable);

export default router;
