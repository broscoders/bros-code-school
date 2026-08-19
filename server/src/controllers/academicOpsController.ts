import type { Response } from "express";
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

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const record = await Attendance.create({ ...req.body, schoolId: req.user!.schoolId });

    if (req.body.status === "ABSENT" || req.body.status === "LATE") {
      const student = await Student.findById(req.body.studentId).populate("userId");
      const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId: req.user!.schoolId,
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

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const records = await Attendance.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createHomework = async (req: AuthRequest, res: Response) => {
  try {
    const hw = await Homework.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(hw);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getHomework = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Homework.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitHomework = async (req: AuthRequest, res: Response) => {
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

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Assignment.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
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

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Exam.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const enterResult = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.findOne({ _id: req.body.examId, schoolId: req.user!.schoolId });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const existing = await Result.findOne({ examId: req.body.examId, studentId: req.body.studentId });

    if (existing?.isPublished) {
      const canCorrect = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR"].includes(req.user!.role);
      if (!canCorrect) {
        return res.status(403).json({ message: "This result is already published. Ask an academic coordinator or admin to correct it." });
      }
    }

    const result = await Result.findOneAndUpdate(
      { examId: req.body.examId, studentId: req.body.studentId },
      req.body,
      { upsert: true, new: true }
    );

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: (req.body.enteredByName as string) || "Unknown",
        userRole: req.user.role,
        action: existing ? (existing.isPublished ? "Corrected a published result" : "Updated result") : "Entered result",
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

export const publishResults = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId: req.user!.schoolId });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    await Result.updateMany({ examId: req.params.examId }, { isPublished: true, publishedAt: new Date() });

    const results = await Result.find({ examId: req.params.examId });
    for (const result of results) {
      const student = await Student.findById(result.studentId);
      const parent = await Parent.findOne({ children: result.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id && student) {
        await notify({
          schoolId: student.schoolId.toString(),
          userId: (parent.userId as any)._id.toString(),
          title: "Result published",
          message: `${exam.name} results have been published.`,
          category: "ACADEMIC",
        });
      }
    }

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: (req.body.publishedByName as string) || "Unknown",
        userRole: req.user.role,
        action: `Published results for exam: ${exam.name}`,
        recordType: "Exam",
        recordId: exam._id.toString(),
      });
    }

    res.json({ success: true, count: results.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ _id: req.query.studentId as string, schoolId: req.user!.schoolId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const filter: Record<string, any> = { studentId: req.query.studentId as string };
    if (["PARENT", "STUDENT"].includes(req.user!.role)) filter.isPublished = true;

    const results = await Result.find(filter).populate("examId");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createFeeStructure = async (req: AuthRequest, res: Response) => {
  try {
    const fee = await FeeStructure.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await Invoice.create({ ...req.body, schoolId: req.user!.schoolId });

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

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await Invoice.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const payInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
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
