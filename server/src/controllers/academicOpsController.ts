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
import Section from "../models/Section";
import Parent from "../models/Parent";
import Discount from "../models/Discount";
import { canAccessStudent } from "../utils/accessControl";
import { logAudit } from "../utils/auditLogger";
import { notify } from "../utils/notifier";
import type { AuthRequest } from "../middleware/authMiddleware";

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const belongsToSchool = await Student.findOne({ _id: req.body.studentId, schoolId: req.user!.schoolId });
    if (!belongsToSchool) return res.status(404).json({ message: "Student not found in your school" });

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

export const bulkMarkAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, sectionId, date, records } = req.body;
    const schoolId = req.user!.schoolId;

    const section = await Section.findOne({ _id: sectionId, schoolId });
    if (!section) return res.status(404).json({ message: "Section not found in your school" });

    const studentIds = (records || []).map((r: any) => r.studentId);
    const validStudents = await Student.find({ _id: { $in: studentIds }, schoolId }).select("_id");
    const validIds = new Set(validStudents.map((s) => s._id.toString()));

    const ops = (records || [])
      .filter((r: any) => validIds.has(r.studentId))
      .map((r: any) => ({
        updateOne: {
          filter: { studentId: r.studentId, date: new Date(date) },
          update: {
            $set: {
              status: r.status,
              schoolId,
              classId,
              sectionId,
              markedBy: req.user!.userId,
            },
          },
          upsert: true,
        },
      }));

    if (ops.length === 0) return res.status(400).json({ message: "No valid students to mark" });

    await Attendance.bulkWrite(ops);

    const absentOrLate = records.filter((r: any) => validIds.has(r.studentId) && (r.status === "ABSENT" || r.status === "LATE"));
    for (const rec of absentOrLate) {
      const student = await Student.findById(rec.studentId).populate("userId");
      const parent = await Parent.findOne({ children: rec.studentId });
      if (parent) {
        await notify({
          schoolId,
          userId: parent.userId.toString(),
          title: rec.status === "ABSENT" ? "Child marked absent" : "Child marked late",
          message: `${(student?.userId as any)?.name || "Your child"} was marked ${rec.status.toLowerCase()} today.`,
          category: "ATTENDANCE",
        });
      }
    }

    res.json({ marked: ops.length, parentsNotified: absentOrLate.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

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
    const homework = await Homework.findOne({ _id: req.body.homeworkId, schoolId: req.user!.schoolId });
    if (!homework) return res.status(404).json({ message: "Homework not found in your school" });

    let studentId = req.body.studentId;
    if (req.user!.role === "STUDENT") {
      const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myStudent) return res.status(403).json({ message: "Student profile not found" });
      studentId = myStudent._id.toString();
    } else {
      const belongs = await Student.findOne({ _id: studentId, schoolId: req.user!.schoolId });
      if (!belongs) return res.status(404).json({ message: "Student not found in your school" });
    }

    const submission = await HomeworkSubmission.findOneAndUpdate(
      { homeworkId: req.body.homeworkId, studentId },
      { ...req.body, studentId, status: "SUBMITTED", submittedAt: new Date() },
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
    const assignment = await Assignment.findOne({ _id: req.body.assignmentId, schoolId: req.user!.schoolId });
    if (!assignment) return res.status(404).json({ message: "Assignment not found in your school" });

    let studentId = req.body.studentId;
    if (req.user!.role === "STUDENT") {
      const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myStudent) return res.status(403).json({ message: "Student profile not found" });
      studentId = myStudent._id.toString();
    } else {
      const belongs = await Student.findOne({ _id: studentId, schoolId: req.user!.schoolId });
      if (!belongs) return res.status(404).json({ message: "Student not found in your school" });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: req.body.assignmentId, studentId },
      { ...req.body, studentId, status: "SUBMITTED", submittedAt: new Date() },
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

    const belongsToSchool = await Student.findOne({ _id: req.body.studentId, schoolId: req.user!.schoolId });
    if (!belongsToSchool) return res.status(404).json({ message: "Student not found in your school" });

    const marksObtained = Number(req.body.marksObtained);
    if (Number.isNaN(marksObtained) || marksObtained < 0) {
      return res.status(400).json({ message: "Marks obtained must be a valid non-negative number" });
    }
    if (marksObtained > exam.totalMarks) {
      return res.status(400).json({ message: `Marks obtained (${marksObtained}) cannot exceed total marks (${exam.totalMarks})` });
    }

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
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

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

export const getResultsByExam = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId: req.user!.schoolId });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const results = await Result.find({ examId: req.params.examId }).populate({
      path: "studentId",
      populate: { path: "userId", select: "name" },
    });
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
    const schoolId = req.user!.schoolId;
    let finalAmount = Number(req.body.amount);
    const activeDiscount = await Discount.findOne({ schoolId, studentId: req.body.studentId, status: "APPROVED", isActive: true });
    let originalAmount: number | undefined;
    if (activeDiscount) {
      originalAmount = finalAmount;
      if (activeDiscount.percentage) {
        finalAmount = Math.round(finalAmount * (1 - activeDiscount.percentage / 100));
      } else if (activeDiscount.fixedAmount) {
        finalAmount = Math.max(0, finalAmount - activeDiscount.fixedAmount);
      }
    }

    const invoice = await Invoice.create({
      ...req.body,
      schoolId,
      amount: finalAmount,
      originalAmount,
      discountApplied: activeDiscount ? activeDiscount._id : undefined,
    });

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

export const bulkCreateInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, sectionId, feeType, amount, dueDate } = req.body;

    if (!classId || !feeType || !amount || !dueDate) {
      return res.status(400).json({ message: "classId, feeType, amount and dueDate are required" });
    }

    const filter: Record<string, any> = { schoolId, classId, status: "ACTIVE" };
    if (sectionId) filter.sectionId = sectionId;
    const students = await Student.find(filter);

    if (students.length === 0) {
      return res.status(400).json({ message: "No active students found for this class/section" });
    }

    let created = 0;
    let skipped = 0;
    for (const student of students) {
      const existing = await Invoice.findOne({ schoolId, studentId: student._id, feeType, status: { $ne: "CANCELLED" } });
      if (existing) {
        skipped++;
        continue;
      }
      await Invoice.create({ schoolId, studentId: student._id, feeType, amount, dueDate });
      const parent = await Parent.findOne({ children: student._id }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId,
          userId: (parent.userId as any)._id.toString(),
          title: "New fee invoice",
          message: `A new ${feeType} invoice of Rs. ${amount} has been generated.`,
          category: "FINANCE",
        });
      }
      created++;
    }

    res.status(201).json({ message: `Created ${created} invoice(s). ${skipped} student(s) already had this fee type invoiced.`, created, skipped });
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
    const existing = await Invoice.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!existing) return res.status(404).json({ message: "Invoice not found" });

    const paymentNow = Number(req.body.amount) || 0;
    if (paymentNow <= 0) return res.status(400).json({ message: "Payment amount must be greater than zero" });

    const newPaidAmount = (existing.paidAmount || 0) + paymentNow;
    const newStatus = newPaidAmount >= existing.amount ? "PAID" : "PARTIAL";

    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      {
        status: newStatus,
        paidAmount: newPaidAmount,
        paidDate: newStatus === "PAID" ? new Date() : existing.paidDate,
      },
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
