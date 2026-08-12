import { Router } from "express";
import {
  addBook, getBooks, issueBook, returnBook,
  addVehicle, getVehicles,
  createComplaint, getComplaints, updateComplaintStatus,
  createEvent, getEvents,
  createPTMSlot, getPTMSlots, bookPTMSlot,
  addAchievement, getAchievements,
} from "../controllers/miscController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { LIBRARY_STAFF, TRANSPORT_STAFF, FRONT_DESK_STAFF, ACADEMIC_STAFF, TEACHING_STAFF, EVERYONE, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/library/books", protect, requireRole(...LIBRARY_STAFF), addBook);
router.get("/library/books", protect, requireRole(...EVERYONE), getBooks);
router.post("/library/issue", protect, requireRole(...LIBRARY_STAFF), issueBook);
router.put("/library/return/:id", protect, requireRole(...LIBRARY_STAFF), returnBook);

router.post("/transport/vehicles", protect, requireRole(...TRANSPORT_STAFF), addVehicle);
router.get("/transport/vehicles", protect, requireRole(...EVERYONE), getVehicles);

router.post("/complaints", protect, requireRole(...EVERYONE), createComplaint);
router.get("/complaints", protect, requireRole(...FRONT_DESK_STAFF), getComplaints);
router.put("/complaints/:id/status", protect, requireRole(...FRONT_DESK_STAFF), updateComplaintStatus);

router.post("/events", protect, requireRole(...ACADEMIC_STAFF), createEvent);
router.get("/events", protect, requireRole(...EVERYONE), getEvents);

router.post("/ptm-slots", protect, requireRole(...TEACHING_STAFF), createPTMSlot);
router.get("/ptm-slots", protect, requireRole(...EVERYONE), getPTMSlots);
router.put("/ptm-slots/:id/book", protect, requireRole(ROLES.PARENT, ...TEACHING_STAFF), bookPTMSlot);

router.post("/achievements", protect, requireRole(...TEACHING_STAFF), addAchievement);
router.get("/achievements", protect, requireRole(...EVERYONE), getAchievements);

export default router;
