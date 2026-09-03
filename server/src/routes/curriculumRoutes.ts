import { Router } from "express";
import { addTopic, getTopics, updateTopicStatus, deleteTopic, getCurriculumProgressSummary } from "../controllers/curriculumController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TEACHING_STAFF, ANY_ADMIN_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/topics", protect, requireRole(...TEACHING_STAFF), addTopic);
router.get("/topics", protect, requireRole(...TEACHING_STAFF, ...ANY_ADMIN_STAFF), getTopics);
router.put("/topics/:id/status", protect, requireRole(...TEACHING_STAFF), updateTopicStatus);
router.delete("/topics/:id", protect, requireRole(...TEACHING_STAFF), deleteTopic);
router.get("/progress-summary", protect, requireRole(...ANY_ADMIN_STAFF), getCurriculumProgressSummary);

export default router;
