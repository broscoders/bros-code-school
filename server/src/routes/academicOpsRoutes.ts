import { Router } from "express";
import {
  markAttendance, bulkMarkAttendance, getAttendance,
  createHomework, getHomework, submitHomework,
  createAssignment, getAssignments, submitAssignment,
  createExam, getExams,
  enterResult, getResults, publishResults,
  createFeeStructure, createInvoice, getInvoices, payInvoice,
} from "../controllers/academicOpsController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TEACHING_STAFF, ACADEMIC_STAFF, FINANCE_STAFF, EVERYONE, ROLES } from "../middleware/permissions";

const router = Router();

router.post("/attendance", protect, requireRole(...TEACHING_STAFF), markAttendance);
router.post("/attendance/bulk", protect, requireRole(...TEACHING_STAFF), bulkMarkAttendance);
router.get("/attendance", protect, requireRole(...EVERYONE), getAttendance);

router.post("/homework", protect, requireRole(...TEACHING_STAFF), createHomework);
router.get("/homework", protect, requireRole(...EVERYONE), getHomework);
router.post("/homework/submit", protect, requireRole(ROLES.STUDENT, ...TEACHING_STAFF), submitHomework);

router.post("/assignments", protect, requireRole(...TEACHING_STAFF), createAssignment);
router.get("/assignments", protect, requireRole(...EVERYONE), getAssignments);
router.post("/assignments/submit", protect, requireRole(ROLES.STUDENT, ...TEACHING_STAFF), submitAssignment);

router.post("/exams", protect, requireRole(...ACADEMIC_STAFF), createExam);
router.get("/exams", protect, requireRole(...EVERYONE), getExams);

router.post("/results", protect, requireRole(...TEACHING_STAFF), enterResult);
router.get("/results", protect, requireRole(...EVERYONE), getResults);
router.put("/results/:examId/publish", protect, requireRole(...ACADEMIC_STAFF), publishResults);

router.post("/fee-structures", protect, requireRole(...FINANCE_STAFF), createFeeStructure);
router.post("/invoices", protect, requireRole(...FINANCE_STAFF), createInvoice);
router.get("/invoices", protect, requireRole(...EVERYONE), getInvoices);
router.put("/invoices/:id/pay", protect, requireRole(ROLES.PARENT, ...FINANCE_STAFF), payInvoice);

export default router;

