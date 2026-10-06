import { Router } from "express";
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from "../controllers/announcementController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMIC_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...ACADEMIC_STAFF), createAnnouncement);
router.get("/", protect, requireRole(...EVERYONE), getAnnouncements);
router.delete("/:id", protect, requireRole(...ACADEMIC_STAFF), deleteAnnouncement);

export default router;
