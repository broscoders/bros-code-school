import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Department from "../models/Department";
import StaffProfile from "../models/StaffProfile";
import PayrollRecord from "../models/PayrollRecord";
import StaffLoan from "../models/StaffLoan";
import { logAudit } from "../utils/auditLogger";
import { syncLinkedAccountStatus, accountStatusForLifecycleStatus } from "../utils/accountSync";

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

    const impliedAccountStatus = accountStatusForLifecycleStatus(employmentStatus);
    if (impliedAccountStatus) {
      await syncLinkedAccountStatus(staff.userId, impliedAccountStatus, `Employment status: ${employmentStatus}`);
    }

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

    // Blueprint 39 explicitly calls for loan/advance repayments to be part
    // of payroll - an approved loan's monthly installment is deducted here
    // automatically, and the loan's remaining balance is paid down by that
    // same amount so it eventually completes on its own.
    const activeLoan = await StaffLoan.findOne({ schoolId: req.user!.schoolId, staffId, status: "APPROVED" });
    const loanDeduction = activeLoan ? Math.min(activeLoan.monthlyDeduction, activeLoan.remainingBalance) : 0;

    const netSalary = staff.basicSalary + Number(allowances || 0) + Number(bonus || 0) - Number(deductions || 0) - loanDeduction;

    const record = await PayrollRecord.create({
      schoolId: staff.schoolId,
      staffId,
      month,
      year,
      basicSalary: staff.basicSalary,
      allowances: allowances || 0,
      deductions: (deductions || 0) + loanDeduction,
      bonus: bonus || 0,
      netSalary,
    });

    if (activeLoan && loanDeduction > 0) {
      activeLoan.remainingBalance -= loanDeduction;
      if (activeLoan.remainingBalance <= 0) activeLoan.status = "COMPLETED";
      await activeLoan.save();
    }

    res.status(201).json({ ...record.toObject(), loanDeduction });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const requestStaffLoan = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId, amount, reason, monthlyDeduction } = req.body;
    const staff = await StaffProfile.findOne({ _id: staffId, schoolId: req.user!.schoolId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const loan = await StaffLoan.create({
      schoolId: req.user!.schoolId,
      staffId,
      amount,
      reason,
      monthlyDeduction,
      remainingBalance: amount,
      requestedBy: req.user!.userId,
    });
    res.status(201).json(loan);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// HR/admin-only route restriction - staff can request a loan, but approval
// (like every other approval workflow in this app) is a separate, more
// privileged step so a requester can never self-approve their own loan.
export const updateStaffLoanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ message: "Invalid status" });

    const loan = await StaffLoan.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId, status: "PENDING" },
      { status, approvedBy: req.user!.userId },
      { new: true }
    );
    if (!loan) return res.status(400).json({ message: "Loan not found or already processed" });
    res.json(loan);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStaffLoans = async (req: AuthRequest, res: Response) => {
  try {
    const loans = await StaffLoan.find({ schoolId: req.user!.schoolId })
      .populate({ path: "staffId", populate: { path: "userId" } })
      .sort({ createdAt: -1 });
    res.json(loans);
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
