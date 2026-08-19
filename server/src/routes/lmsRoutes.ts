import { Router } from "express";
import {
  createCourse,
  getCoursesForTeacher,
  getCoursesForClass,
  togglePublishCourse,
  addLesson,
  getLessons,
  deleteLesson,
  markLessonProgress,
  getCourseProgressSummary,
} from "../controllers/lmsController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TEACHING_STAFF, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/courses", protect, requireRole(...TEACHING_STAFF), createCourse);
router.get("/courses/teacher", protect, requireRole(...TEACHING_STAFF), getCoursesForTeacher);
router.get("/courses/class", protect, requireRole(...TEACHING_STAFF, ROLES.STUDENT), getCoursesForClass);
router.put("/courses/:id/publish", protect, requireRole(...TEACHING_STAFF), togglePublishCourse);
router.get("/courses/:id/progress-summary", protect, requireRole(...TEACHING_STAFF), getCourseProgressSummary);

router.post("/lessons", protect, requireRole(...TEACHING_STAFF), addLesson);
router.get("/lessons", protect, requireRole(...TEACHING_STAFF, ROLES.STUDENT), getLessons);
router.delete("/lessons/:id", protect, requireRole(...TEACHING_STAFF), deleteLesson);

router.post("/progress", protect, requireRole(ROLES.STUDENT), markLessonProgress);

export default router;
