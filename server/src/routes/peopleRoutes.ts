import { Router } from "express";
import {
  createStudent, getStudents, getStudentById, updateStudentStatus, transferStudent,
  createParent, getParents,
  createTeacher, getTeachers, updateTeacherStatus,
} from "../controllers/peopleController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ADMISSIONS_STAFF, EVERYONE, TOP_ADMIN, ROLES, ACADEMIC_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/students", protect, requireRole(...ADMISSIONS_STAFF, ROLES.ACADEMIC_COORDINATOR), createStudent);
router.get("/students", protect, requireRole(...EVERYONE), getStudents);
router.get("/students/:id", protect, requireRole(...EVERYONE), getStudentById);
router.put("/students/:id/status", protect, requireRole(...ACADEMIC_STAFF), updateStudentStatus);
router.put("/students/:id/transfer", protect, requireRole(...ACADEMIC_STAFF), transferStudent);

router.post("/parents", protect, requireRole(...ADMISSIONS_STAFF), createParent);
router.get("/parents", protect, requireRole(...EVERYONE), getParents);

router.post("/teachers", protect, requireRole(...TOP_ADMIN, ROLES.HEAD), createTeacher);
router.get("/teachers", protect, requireRole(...EVERYONE), getTeachers);
router.put("/teachers/:id/status", protect, requireRole(...TOP_ADMIN, ROLES.HEAD), updateTeacherStatus);

export default router;
