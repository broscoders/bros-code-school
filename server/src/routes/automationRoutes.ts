import { Router } from "express";
import { getRules, updateRule, runDueReminders, runRemindersForAllSchools } from "../controllers/automationController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TOP_ADMIN } from "../middleware/permissions";

const router = Router();

router.get("/rules", protect, requireRole(...TOP_ADMIN), getRules);
router.put("/rules/:id", protect, requireRole(...TOP_ADMIN), updateRule);
router.post("/run-reminders", protect, requireRole(...TOP_ADMIN), runDueReminders);

router.get("/cron/run-reminders", runRemindersForAllSchools);

export default router;
