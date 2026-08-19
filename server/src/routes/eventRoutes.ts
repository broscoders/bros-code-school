import { Router } from "express";
import { createEvent, getEvents } from "../controllers/eventController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMIC_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...ACADEMIC_STAFF), createEvent);
router.get("/", protect, requireRole(...EVERYONE), getEvents);

export default router;
