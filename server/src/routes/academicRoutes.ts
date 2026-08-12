import { Router } from "express";
import {
  createSession,
  getSessions,
  createClass,
  getClasses,
  createSection,
  getSections,
  createSubject,
  getSubjects,
} from "../controllers/academicController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ACADEMIC_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/sessions", protect, requireRole(...ACADEMIC_STAFF), createSession);
router.get("/sessions", protect, requireRole(...EVERYONE), getSessions);

router.post("/classes", protect, requireRole(...ACADEMIC_STAFF), createClass);
router.get("/classes", protect, requireRole(...EVERYONE), getClasses);

router.post("/sections", protect, requireRole(...ACADEMIC_STAFF), createSection);
router.get("/sections", protect, requireRole(...EVERYONE), getSections);

router.post("/subjects", protect, requireRole(...ACADEMIC_STAFF), createSubject);
router.get("/subjects", protect, requireRole(...EVERYONE), getSubjects);

export default router;
