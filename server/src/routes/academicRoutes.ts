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

const router = Router();

router.post("/sessions", createSession);
router.get("/sessions", getSessions);

router.post("/classes", createClass);
router.get("/classes", getClasses);

router.post("/sections", createSection);
router.get("/sections", getSections);

router.post("/subjects", createSubject);
router.get("/subjects", getSubjects);

export default router;
