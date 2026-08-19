import { Router } from "express";
import { getUnifiedCalendar, getActivityFeed } from "../controllers/dashboardController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { EVERYONE } from "../middleware/permissions";

const router = Router();

router.get("/calendar", protect, requireRole(...EVERYONE), getUnifiedCalendar);
router.get("/activity", protect, requireRole(...EVERYONE), getActivityFeed);

export default router;
