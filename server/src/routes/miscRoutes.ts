import { Router } from "express";
import {
  addBook, getBooks, issueBook, returnBook,
  addVehicle, getVehicles,
  createComplaint, getComplaints, updateComplaintStatus,
  createEvent, getEvents,
  createPTMSlot, getPTMSlots, bookPTMSlot,
  addAchievement, getAchievements,
} from "../controllers/miscController";

const router = Router();

router.post("/library/books", addBook);
router.get("/library/books", getBooks);
router.post("/library/issue", issueBook);
router.put("/library/return/:id", returnBook);

router.post("/transport/vehicles", addVehicle);
router.get("/transport/vehicles", getVehicles);

router.post("/complaints", createComplaint);
router.get("/complaints", getComplaints);
router.put("/complaints/:id/status", updateComplaintStatus);

router.post("/events", createEvent);
router.get("/events", getEvents);

router.post("/ptm-slots", createPTMSlot);
router.get("/ptm-slots", getPTMSlots);
router.put("/ptm-slots/:id/book", bookPTMSlot);

router.post("/achievements", addAchievement);
router.get("/achievements", getAchievements);

export default router;
