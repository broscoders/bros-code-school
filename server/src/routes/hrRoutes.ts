import { Router } from "express";
import {
  createDepartment, getDepartments,
  createStaffProfile, getStaffProfiles, updateStaffStatus,
  generatePayroll, getPayrollRecords, markPayrollPaid,
  requestStaffLoan, updateStaffLoanStatus, getStaffLoans,
} from "../controllers/hrController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { HR_MANAGERS, ANY_ADMIN_STAFF, TOP_ADMIN } from "../middleware/permissions";

const router = Router();

router.post("/departments", protect, requireRole(...HR_MANAGERS), createDepartment);
router.get("/departments", protect, requireRole(...ANY_ADMIN_STAFF), getDepartments);

router.post("/staff", protect, requireRole(...HR_MANAGERS), createStaffProfile);
router.get("/staff", protect, requireRole(...ANY_ADMIN_STAFF), getStaffProfiles);
router.put("/staff/:id/status", protect, requireRole(...HR_MANAGERS), updateStaffStatus);

router.post("/payroll", protect, requireRole(...HR_MANAGERS), generatePayroll);
router.get("/payroll", protect, requireRole(...HR_MANAGERS), getPayrollRecords);
router.put("/payroll/:id/pay", protect, requireRole(...HR_MANAGERS), markPayrollPaid);

// Loan approval is restricted to TOP_ADMIN specifically - a step above
// HR_MANAGERS (who can request one) - so the person requesting a loan on
// a staff member's behalf is never the same role tier that can approve it.
router.post("/loans", protect, requireRole(...HR_MANAGERS), requestStaffLoan);
router.get("/loans", protect, requireRole(...HR_MANAGERS), getStaffLoans);
router.put("/loans/:id/status", protect, requireRole(...TOP_ADMIN), updateStaffLoanStatus);

export default router;
