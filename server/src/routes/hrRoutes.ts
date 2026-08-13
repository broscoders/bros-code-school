import { Router } from "express";
import {
  createDepartment, getDepartments,
  createStaffProfile, getStaffProfiles,
  generatePayroll, getPayrollRecords, markPayrollPaid,
} from "../controllers/hrController";

const router = Router();

router.post("/departments", createDepartment);
router.get("/departments", getDepartments);

router.post("/staff", createStaffProfile);
router.get("/staff", getStaffProfiles);

router.post("/payroll", generatePayroll);
router.get("/payroll", getPayrollRecords);
router.put("/payroll/:id/pay", markPayrollPaid);

export default router;
