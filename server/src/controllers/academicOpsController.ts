import type { Request, Response } from "express";
import Attendance from "../models/Attendance";
import Homework from "../models/Homework";
import HomeworkSubmission from "../models/HomeworkSubmission";
import Assignment from "../models/Assignment";
import AssignmentSubmission from "../models/AssignmentSubmission";
import Exam from "../models/Exam";
import Result from "../models/Result";
import FeeStructure from "../models/FeeStructure";
import Invoice from "../models/Invoice";
import Student from "../models/Student";
import Parent from "../models/Parent";
import { logAudit } from "../utils/auditLogger";
import { notify } from "../utils/notifier";
import type { AuthRequest } from "../middleware/authMiddleware";

// Attendance
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const record = await Attendance.create(req.body);

    if (req.body.status === "ABSENT" || req.body.status === "LATE") {
      const student = await Student.findById(req.body.studentId).populate("userId");
      const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId: req.body.schoolId,
          userId: (parent.userId as any)._id.toString(),
          title: req.body.status === "ABSENT" ? "Child marked absent" : "Child marked late",
          message: `${(student?.userId as any)?.name || "Your child"} was marked ${req.body.status.toLowerCase()} today.`,
          category: "ATTENDANCE",
        });
      }
    }

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const records = await Attendance.find({ studentId: req.query.studentId });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Homework
export const createHomework = async (req: Request, res: Response) => {
  try {
    const hw = await Homework.create(req.body);
    res.status(201).json(hw);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getHomework = async (req: Request, res: Response) => {
  try {
    const list = await Homework.find({ classId: req.query.classId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitHomework = async (req: Request, res: Response) => {
  try {
    const submission = await HomeworkSubmission.findOneAndUpdate(
      { homeworkId: req.body.homeworkId, studentId: req.body.studentId },
      { ...req.body, status: "SUBMITTED", submittedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Assignment
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.create(req.body);
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const list = await Assignment.find({ classId: req.query.classId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: req.body.assignmentId, studentId: req.body.studentId },
      { ...req.body, status: "SUBMITTED", submittedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Exam
export const createExam = async (req: Request, res: Response) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getExams = async (req: Request, res: Response) => {
  try {
    const list = await Exam.find({ classId: req.query.classId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Result (with audit + notification)
export const enterResult = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Result.findOne({ examId: req.body.examId, studentId: req.body.studentId });
    const result = await Result.findOneAndUpdate(
      { examId: req.body.examId, studentId: req.body.studentId },
      req.body,
      { upsert: true, new: true }
    );

    if (req.user) {
      await logAudit({
        schoolId: req.body.schoolId || "",
        userId: req.user.userId,
        userName: (req.body.enteredByName as string) || "Unknown",
        userRole: req.user.role,
        action: existing ? "Updated result" : "Entered result",
        recordType: "Result",
        recordId: result._id.toString(),
        oldValue: existing ? { marksObtained: existing.marksObtained } : undefined,
        newValue: { marksObtained: result.marksObtained },
      });
    }

    if (!existing) {
      const student = await Student.findById(req.body.studentId);
      const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id && student) {
        await notify({
          schoolId: student.schoolId.toString(),
          userId: (parent.userId as any)._id.toString(),
          title: "New result published",
          message: `A new exam result has been published for your child.`,
          category: "ACADEMIC",
        });
      }
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getResults = async (req: Request, res: Response) => {
  try {
    const results = await Result.find({ studentId: req.query.studentId }).populate("examId");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Fees
export const createFeeStructure = async (req: Request, res: Response) => {
  try {
    const fee = await FeeStructure.create(req.body);
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await Invoice.create(req.body);

    const student = await Student.findById(req.body.studentId);
    const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
    if (parent && (parent.userId as any)?._id && student) {
      await notify({
        schoolId: student.schoolId.toString(),
        userId: (parent.userId as any)._id.toString(),
        title: "New fee invoice",
        message: `A new ${req.body.feeType} invoice of Rs. ${req.body.amount} has been generated.`,
        category: "FINANCE",
      });
    }

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await Invoice.find({ studentId: req.query.studentId });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const payInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: "PAID", paidDate: new Date(), paidAmount: req.body.paidAmount },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (req.user) {
      await logAudit({
        schoolId: invoice.schoolId.toString(),
        userId: req.user.userId,
        userName: (req.body.markedByName as string) || "Unknown",
        userRole: req.user.role,
        action: "Marked invoice as paid",
        recordType: "Invoice",
        recordId: invoice._id.toString(),
        newValue: { status: "PAID", amount: invoice.amount },
      });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
