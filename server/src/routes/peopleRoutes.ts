import { Router } from "express";
import {
  createStudent, getStudents, getStudentById,
  createParent, getParents,
  createTeacher, getTeachers,
} from "../controllers/peopleController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ADMISSIONS_STAFF, EVERYONE, TOP_ADMIN, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/students", protect, requireRole(...ADMISSIONS_STAFF, ROLES.ACADEMIC_COORDINATOR), createStudent);
router.get("/students", protect, requireRole(...EVERYONE), getStudents);
router.get("/students/:id", protect, requireRole(...EVERYONE), getStudentById);

router.post("/parents", protect, requireRole(...ADMISSIONS_STAFF), createParent);
router.get("/parents", protect, requireRole(...EVERYONE), getParents);

router.post("/teachers", protect, requireRole(...TOP_ADMIN, ROLES.HEAD), createTeacher);
router.get("/teachers", protect, requireRole(...EVERYONE), getTeachers);

export default router;
