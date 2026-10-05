import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Department from "../models/Department";
import StaffProfile from "../models/StaffProfile";
import PayrollRecord from "../models/PayrollRecord";
import StaffLoan from "../models/StaffLoan";
import Teacher from "../models/Teacher";
import User from "../models/User";
import StaffAttendance from "../models/StaffAttendance";
import { logAudit } from "../utils/auditLogger";
import { syncLinkedAccountStatus, accountStatusForLifecycleStatus } from "../utils/accountSync";
import { actorName } from "../utils/auditActor";

// Blueprint 34 (Attendance): "Teacher/staff: Present, Absent, Late, Early
// departure, Leave" - this was entirely missing (only student attendance
// existed). A single combined roster - Teacher accounts and StaffProfile
// accounts both included - since a school marking morning attendance
// doesn't think of "teachers" and "other staff" as two separate exercises.
export const getStaffRoster = async (req: AuthRequest, res: Response) => {
  try {
    const [teachers, staff] = await Promise.all([
      Teacher.find({ schoolId: req.user!.schoolId, employmentStatus: "ACTIVE" }).populate("userId", "name"),
      StaffProfile.find({ schoolId: req.user!.schoolId, employmentStatus: "ACTIVE" }).populate("userId", "name role"),
    ]);

    // skip records whose login account no longer exists instead of crashing the whole roster
    const roster = [
      ...teachers.filter((t) => t.userId).map((t) => ({ userId: (t.userId as any)._id, name: (t.userId as any).name, role: "TEACHER", employeeId: t.employeeId })),
      ...staff.filter((s) => s.userId).map((s) => ({ userId: (s.userId as any)._id, name: (s.userId as any).name, role: (s.userId as any).role, employeeId: s.employeeId })),
    ];

    res.json(roster);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markStaffAttendanceBulk = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { date, records } = req.body as { date: string; records: { userId: string; status: string }[] };
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "date and at least one record are required" });
    }
    const day = new Date(date);
    if (Number.isNaN(day.getTime())) return res.status(400).json({ message: "Invalid date" });
    if (day.getTime() > Date.now() + 24 * 60 * 60 * 1000) return res.status(400).json({ message: "Attendance cannot be marked for a future date" });
    const VALID = ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"];
    if (records.some((r) => !r || !r.userId || !VALID.includes(r.status))) {
      return res.status(400).json({ message: "Every record needs a staff member and a valid status" });
    }

    // only staff of THIS school; invalid statuses used to be saved as-is
    // because findOneAndUpdate does not run enum validation
    const ids = records.map((r) => r.userId);
    const valid = await User.find({ _id: { $in: ids }, schoolId }).select("_id");
    const ok = new Set(valid.map((u) => u._id.toString()));
    const good = records.filter((r) => ok.has(String(r.userId)));
    if (good.length === 0) return res.status(400).json({ message: "No valid staff members to mark" });

    await StaffAttendance.bulkWrite(
      good.map((r): any => ({
        updateOne: {
          filter: { userId: r.userId, date: day },
          update: { $set: { schoolId, status: r.status, markedBy: req.user!.userId } },
          upsert: true,
        },
      }))
    );

    res.json({ marked: good.length, skipped: records.length - good.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStaffAttendanceForDate = async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.query as { date: string };
    if (!date || Number.isNaN(new Date(date).getTime())) return res.status(400).json({ message: "A valid date is required" });
    const records = await StaffAttendance.find({ schoolId: req.user!.schoolId, date: new Date(date) });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Same idea as the student attendance register export - a whole month in
// one call, shaped for a client-side pivot into a register (rows=staff,
// columns=days), rather than one API call per staff member.
export const getStaffAttendanceRegister = async (req: AuthRequest, res: Response) => {
  try {
    const { month, year } = req.query as { month: string; year: string };
    if (!month || !year) return res.status(400).json({ message: "month and year are required" });

    const monthNum = Number(month);
    const yearNum = Number(year);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12 || !Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ message: "month must be 1-12 and year must be a valid year" });
    }
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 1));

    const records = await StaffAttendance.find({
      schoolId: req.user!.schoolId,
      date: { $gte: startDate, $lt: endDate },
    });

    res.json({ records: records.map((r) => ({ userId: r.userId, date: r.date, status: r.status })) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Department name is required" });
    if (await Department.exists({ schoolId, name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") })) {
      return res.status(409).json({ message: `A department named "${name}" already exists` });
    }
    const dept = await Department.create({ schoolId, name });
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
    const schoolId = req.user!.schoolId;
    const { userId, departmentId, joiningDate } = req.body;
    const employeeId = String(req.body.employeeId || "").trim();
    const designation = String(req.body.designation || "").trim();
    const basicSalary = req.body.basicSalary === undefined || req.body.basicSalary === "" ? 0 : Number(req.body.basicSalary);

    if (!userId || !employeeId || !designation) return res.status(400).json({ message: "Account, employee ID and designation are required" });
    if (!Number.isFinite(basicSalary) || basicSalary < 0) return res.status(400).json({ message: "Basic salary must be zero or more" });

    // must be a non-student, non-parent, non-teacher staff account of this school
    const account = await User.findOne({ _id: userId, schoolId, role: { $nin: ["STUDENT", "PARENT", "TEACHER", "ACADEMY_TEACHER"] } });
    if (!account) return res.status(404).json({ message: "Staff login account not found" });
    if (await StaffProfile.exists({ userId, schoolId })) return res.status(409).json({ message: "This account already has a staff profile" });
    if (await StaffProfile.exists({ schoolId, employeeId })) return res.status(409).json({ message: `Employee ID ${employeeId} is already used` });
    if (departmentId && !(await Department.exists({ _id: departmentId, schoolId }))) return res.status(404).json({ message: "Department not found" });

    const staff = await StaffProfile.create({ schoolId, userId, employeeId, designation, departmentId: departmentId || undefined, joiningDate: joiningDate || undefined, basicSalary });
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
        userName: await actorName(req),
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

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const generatePayroll = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { staffId } = req.body;
    // Amounts arrive from the form as strings ("500"). The old code did
    // `(deductions || 0) + loanDeduction`, which JOINS the text instead of
    // adding (500 + 200 became "500200"), so the stored deduction could be
    // wildly different from the net salary that was calculated.
    const allowances = Number(req.body.allowances || 0);
    const deductions = Number(req.body.deductions || 0);
    const bonus = Number(req.body.bonus || 0);
    if ([allowances, deductions, bonus].some((n) => !Number.isFinite(n) || n < 0)) {
      return res.status(400).json({ message: "Allowances, deductions and bonus must be zero or more" });
    }
    // month name is normalised so "august" and "August" can't both get a payslip
    const month = MONTHS.find((m) => m.toLowerCase() === String(req.body.month || "").trim().toLowerCase());
    const year = Number(req.body.year);
    if (!month) return res.status(400).json({ message: "Please enter a valid month name (e.g. August)" });
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return res.status(400).json({ message: "Please enter a valid year" });

    const staff = await StaffProfile.findOne({ _id: staffId, schoolId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (staff.employmentStatus === "TERMINATED") {
      return res.status(400).json({ message: "Cannot generate payroll for a terminated staff member." });
    }

    const existing = await PayrollRecord.findOne({ schoolId, staffId, month, year });
    if (existing) {
      return res.status(400).json({ message: `A payslip for ${month} ${year} already exists for this staff member.` });
    }

    // approved loan installment is deducted automatically
    const activeLoan = await StaffLoan.findOne({ schoolId, staffId, status: "APPROVED" });
    const loanDeduction = activeLoan ? Math.min(activeLoan.monthlyDeduction, activeLoan.remainingBalance) : 0;

    const totalDeductions = deductions + loanDeduction;
    const netSalary = staff.basicSalary + allowances + bonus - totalDeductions;
    if (netSalary < 0) {
      return res.status(400).json({ message: `Deductions (Rs. ${totalDeductions}) are more than the earnings (Rs. ${staff.basicSalary + allowances + bonus}). Reduce the deductions.` });
    }

    const record = await PayrollRecord.create({
      schoolId,
      staffId,
      month,
      year,
      basicSalary: staff.basicSalary,
      allowances,
      deductions: totalDeductions,
      bonus,
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
    const schoolId = req.user!.schoolId;
    const { staffId } = req.body;
    const amount = Number(req.body.amount);
    const monthlyDeduction = Number(req.body.monthlyDeduction);
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "A reason is required" });
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Loan amount must be greater than zero" });
    // a 0 installment would mean the loan is never repaid
    if (!Number.isFinite(monthlyDeduction) || monthlyDeduction <= 0 || monthlyDeduction > amount) {
      return res.status(400).json({ message: "Monthly deduction must be greater than zero and not more than the loan amount" });
    }
    const staff = await StaffProfile.findOne({ _id: staffId, schoolId });
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (staff.employmentStatus === "TERMINATED") return res.status(400).json({ message: "Cannot give a loan to a terminated staff member" });
    if (await StaffLoan.exists({ schoolId, staffId, status: { $in: ["PENDING", "APPROVED"] } })) {
      return res.status(409).json({ message: "This staff member already has a pending or running loan" });
    }

    const loan = await StaffLoan.create({ schoolId, staffId, amount, reason, monthlyDeduction, remainingBalance: amount, requestedBy: req.user!.userId });
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

    // separation of duties: whoever requested the loan can't approve it
    const pending = await StaffLoan.findOne({ _id: req.params.id, schoolId: req.user!.schoolId, status: "PENDING" });
    if (pending && pending.requestedBy.toString() === req.user!.userId) {
      return res.status(403).json({ message: "You cannot approve a loan you requested yourself. Ask another admin to review it." });
    }
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
    // Only a PENDING payslip can be paid - paying twice used to just overwrite
    // the paid date with no trace. The status filter makes it atomic too.
    const record = await PayrollRecord.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId, status: "PENDING" },
      { status: "PAID", paidDate: new Date() },
      { new: true }
    );
    if (!record) {
      const exists = await PayrollRecord.exists({ _id: req.params.id, schoolId: req.user!.schoolId });
      return res.status(exists ? 400 : 404).json({ message: exists ? "This payslip is already marked as paid" : "Payroll record not found" });
    }
    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: await actorName(req),
      userRole: req.user!.role,
      action: "Marked payslip as paid",
      recordType: "PayrollRecord",
      recordId: record._id.toString(),
      newValue: { status: "PAID", netSalary: record.netSalary, month: record.month, year: record.year },
    });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
