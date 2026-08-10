import { Router } from "express";
import {
  createStudent, getStudents, getStudentById,
  createParent, getParents,
  createTeacher, getTeachers,
} from "../controllers/peopleController";

const router = Router();

router.post("/students", createStudent);
router.get("/students", getStudents);
router.get("/students/:id", getStudentById);

router.post("/parents", createParent);
router.get("/parents", getParents);

router.post("/teachers", createTeacher);
router.get("/teachers", getTeachers);

export default router;
