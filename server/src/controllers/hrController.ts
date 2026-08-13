import type { Request, Response } from "express";
import Department from "../models/Department";
import StaffProfile from "../models/StaffProfile";
import PayrollRecord from "../models/PayrollRecord";

// Departments
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const list = await Department.find({ schoolId: req.query.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Staff
export const createStaffProfile = async (req: Request, res: Response) => {
  try {
    const staff = await StaffProfile.create(req.body);
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStaffProfiles = async (req: Request, res: Response) => {
  try {
    const list = await StaffProfile.find({ schoolId: req.query.schoolId }).populate("userId departmentId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Payroll
export const generatePayroll = async (req: Request, res: Response) => {
  try {
    const { staffId, month, year, allowances, deductions, bonus } = req.body;
    const staff = await StaffProfile.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const netSalary = staff.basicSalary + Number(allowances || 0) + Number(bonus || 0) - Number(deductions || 0);

    const record = await PayrollRecord.create({
      schoolId: staff.schoolId,
      staffId,
      month,
      year,
      basicSalary: staff.basicSalary,
      allowances: allowances || 0,
      deductions: deductions || 0,
      bonus: bonus || 0,
      netSalary,
    });

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getPayrollRecords = async (req: Request, res: Response) => {
  try {
    const list = await PayrollRecord.find({ schoolId: req.query.schoolId }).populate({ path: "staffId", populate: { path: "userId" } }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markPayrollPaid = async (req: Request, res: Response) => {
  try {
    const record = await PayrollRecord.findByIdAndUpdate(req.params.id, { status: "PAID", paidDate: new Date() }, { new: true });
    if (!record) return res.status(404).json({ message: "Payroll record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
