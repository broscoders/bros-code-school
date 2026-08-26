import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Department from "../models/Department";
import StaffProfile from "../models/StaffProfile";
import PayrollRecord from "../models/PayrollRecord";
import { logAudit } from "../utils/auditLogger";

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const dept = await Department.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Department.find({ schoolId: req.user!.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createStaffProfile = async (req: AuthRequest, res: Response) => {
  try {
    const staff = await StaffProfile.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(staff);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStaffProfiles = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { schoolId: req.user!.schoolId };
    const status = req.query.status as string | undefined;
    if (!status || status === "ACTIVE") filter.employmentStatus = "ACTIVE";
    else if (status !== "ANY") filter.employmentStatus = status;

    const list = await StaffProfile.find(filter).populate("userId departmentId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateStaffStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { employmentStatus, reason } = req.body;
    const valid = ["ACTIVE", "ON_LEAVE", "TERMINATED"];
    if (!valid.includes(employmentStatus)) return res.status(400).json({ message: "Invalid status" });

    const staff = await StaffProfile.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const oldStatus = staff.employmentStatus;
    staff.employmentStatus = employmentStatus;
    await staff.save();

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: (req.body.changedByName as string) || "Unknown",
        userRole: req.user.role,
        action: `Changed staff employment status: ${oldStatus} -> ${employmentStatus}`,
        recordType: "StaffProfile",
        recordId: staff._id.toString(),
        oldValue: { employmentStatus: oldStatus },
        newValue: { employmentStatus, reason },
      });
    }

    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const generatePayroll = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, month, year, allowances, deductions, bonus } = req.body;
    const staff = await StaffProfile.findOne({ _id: staffId, schoolId: req.user!.schoolId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (staff.employmentStatus === "TERMINATED") {
      return res.status(400).json({ message: "Cannot generate payroll for a terminated staff member." });
    }

    const existing = await PayrollRecord.findOne({ schoolId: req.user!.schoolId, staffId, month, year });
    if (existing) {
      return res.status(400).json({ message: `A payslip for ${month} ${year} already exists for this staff member.` });
    }

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

export const getPayrollRecords = async (req: AuthRequest, res: Response) => {
  try {
    const list = await PayrollRecord.find({ schoolId: req.user!.schoolId }).populate({ path: "staffId", populate: { path: "userId" } }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markPayrollPaid = async (req: AuthRequest, res: Response) => {
  try {
    const record = await PayrollRecord.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status: "PAID", paidDate: new Date() },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: "Payroll record not found" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
