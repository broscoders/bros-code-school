import { Router } from "express";
import { getUnifiedCalendar, getActivityFeed } from "../controllers/dashboardController";

const router = Router();

router.get("/calendar", getUnifiedCalendar);
router.get("/activity", getActivityFeed);

export default router;
