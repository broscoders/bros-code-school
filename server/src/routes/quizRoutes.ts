import { Router } from "express";
import {
  createQuiz,
  getQuizzesForTeacher,
  getQuizzesForClass,
  getAllQuizzesForSchool,
  togglePublish,
  startAttempt,
  submitAttempt,
  getQuizResults,
  overrideAttemptScore,
} from "../controllers/quizController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TEACHING_STAFF, ANY_ADMIN_STAFF, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...TEACHING_STAFF), createQuiz);
router.get("/teacher", protect, requireRole(...TEACHING_STAFF), getQuizzesForTeacher);
router.get("/class", protect, requireRole(...TEACHING_STAFF, ROLES.STUDENT), getQuizzesForClass);
router.get("/school", protect, requireRole(...ANY_ADMIN_STAFF), getAllQuizzesForSchool);
router.put("/:id/publish", protect, requireRole(...TEACHING_STAFF), togglePublish);
router.get("/:id/results", protect, requireRole(...TEACHING_STAFF), getQuizResults);
router.put("/attempt/:id/override-score", protect, requireRole(...TEACHING_STAFF), overrideAttemptScore);

router.post("/attempt/start", protect, requireRole(ROLES.STUDENT), startAttempt);
router.post("/attempt/submit", protect, requireRole(ROLES.STUDENT), submitAttempt);

export default router;
