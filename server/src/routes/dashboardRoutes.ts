import { Router } from "express";
import { getUnifiedCalendar, getActivityFeed, getDashboardSummary } from "../controllers/dashboardController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { EVERYONE, ANY_ADMIN_STAFF } from "../middleware/permissions";

const router = Router();

router.get("/summary", protect, requireRole(...ANY_ADMIN_STAFF), getDashboardSummary);
router.get("/calendar", protect, requireRole(...EVERYONE), getUnifiedCalendar);
router.get("/activity", protect, requireRole(...EVERYONE), getActivityFeed);

export default router;
