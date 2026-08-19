import { Router } from "express";
import { createAnnouncement, getAnnouncements } from "../controllers/announcementController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMIC_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...ACADEMIC_STAFF), createAnnouncement);
router.get("/", protect, requireRole(...EVERYONE), getAnnouncements);

export default router;
