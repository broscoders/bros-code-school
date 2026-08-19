import { Router } from "express";
import {
  createDepartment, getDepartments,
  createStaffProfile, getStaffProfiles, updateStaffStatus,
  generatePayroll, getPayrollRecords, markPayrollPaid,
} from "../controllers/hrController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { HR_MANAGERS, ANY_ADMIN_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/departments", protect, requireRole(...HR_MANAGERS), createDepartment);
router.get("/departments", protect, requireRole(...ANY_ADMIN_STAFF), getDepartments);

router.post("/staff", protect, requireRole(...HR_MANAGERS), createStaffProfile);
router.get("/staff", protect, requireRole(...ANY_ADMIN_STAFF), getStaffProfiles);
router.put("/staff/:id/status", protect, requireRole(...HR_MANAGERS), updateStaffStatus);

router.post("/payroll", protect, requireRole(...HR_MANAGERS), generatePayroll);
router.get("/payroll", protect, requireRole(...HR_MANAGERS), getPayrollRecords);
router.put("/payroll/:id/pay", protect, requireRole(...HR_MANAGERS), markPayrollPaid);

export default router;
