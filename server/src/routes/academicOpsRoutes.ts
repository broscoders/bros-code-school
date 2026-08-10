import { Router } from "express";
import {
  markAttendance, getAttendance,
  createHomework, getHomework, submitHomework,
  createAssignment, getAssignments, submitAssignment,
  createExam, getExams,
  enterResult, getResults,
  createFeeStructure, createInvoice, getInvoices, payInvoice,
} from "../controllers/academicOpsController";

const router = Router();

router.post("/attendance", markAttendance);
router.get("/attendance", getAttendance);

router.post("/homework", createHomework);
router.get("/homework", getHomework);
router.post("/homework/submit", submitHomework);

router.post("/assignments", createAssignment);
router.get("/assignments", getAssignments);
router.post("/assignments/submit", submitAssignment);

router.post("/exams", createExam);
router.get("/exams", getExams);

router.post("/results", enterResult);
router.get("/results", getResults);

router.post("/fee-structures", createFeeStructure);
router.post("/invoices", createInvoice);
router.get("/invoices", getInvoices);
router.put("/invoices/:id/pay", payInvoice);

export default router;
