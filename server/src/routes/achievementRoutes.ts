import { Router } from "express";
import { addAchievement, getAchievements } from "../controllers/achievementController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TEACHING_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...TEACHING_STAFF), addAchievement);
router.get("/", protect, requireRole(...EVERYONE), getAchievements);

export default router;
