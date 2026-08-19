import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import AutomationRule from "../models/AutomationRule";
import Invoice from "../models/Invoice";
import Exam from "../models/Exam";
import Assignment from "../models/Assignment";
import Student from "../models/Student";
import Parent from "../models/Parent";
import { notify } from "../utils/notifier";

const DEFAULT_RULES: { triggerEvent: string; messageTemplate: string }[] = [
  { triggerEvent: "STUDENT_ABSENT", messageTemplate: "{studentName} was marked absent today." },
  { triggerEvent: "FEE_DUE_SOON", messageTemplate: "A fee payment of Rs. {amount} for {studentName} is due on {dueDate}." },
  { triggerEvent: "FEE_OVERDUE", messageTemplate: "A fee payment of Rs. {amount} for {studentName} is now overdue. Please pay as soon as possible." },
  { triggerEvent: "EXAM_APPROACHING", messageTemplate: "{examName} for {studentName} is coming up on {examDate}." },
  { triggerEvent: "ASSIGNMENT_DEADLINE_APPROACHING", messageTemplate: "{assignmentTitle} is due on {dueDate}." },
  { triggerEvent: "RESULT_PUBLISHED", messageTemplate: "New exam results have been published for {studentName}." },
  { triggerEvent: "ADMISSION_APPROVED", messageTemplate: "Your admission application has been approved." },
];

export const getRules = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const existing = await AutomationRule.find({ schoolId });
    if (existing.length >= DEFAULT_RULES.length) return res.json(existing);

    const existingTriggers = existing.map((r) => r.triggerEvent);
    const toSeed = DEFAULT_RULES.filter((d) => !existingTriggers.includes(d.triggerEvent as any));
    for (const rule of toSeed) {
      await AutomationRule.create({ schoolId, ...rule });
    }

    const all = await AutomationRule.find({ schoolId });
    res.json(all);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateRule = async (req: AuthRequest, res: Response) => {
  try {
    const { isActive, messageTemplate } = req.body;
    const rule = await AutomationRule.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { ...(isActive !== undefined && { isActive }), ...(messageTemplate && { messageTemplate }) },
      { new: true }
    );
    if (!rule) return res.status(404).json({ message: "Rule not found" });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

const fillTemplate = (template: string, values: Record<string, string>) =>
  Object.entries(values).reduce((msg, [key, val]) => msg.replaceAll(`{${key}}`, val), template);

export const runDueReminders = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const rules = await AutomationRule.find({ schoolId });
    const ruleFor = (trigger: string) => rules.find((r) => r.triggerEvent === trigger);

    let sent = 0;
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 3);

    const notifyParentOfStudent = async (studentId: any, title: string, message: string, category: string) => {
      const parent = await Parent.findOne({ children: studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({ schoolId, userId: (parent.userId as any)._id.toString(), title, message, category });
        sent++;
      }
    };

    const dueSoonRule = ruleFor("FEE_DUE_SOON");
    const overdueRule = ruleFor("FEE_OVERDUE");
    if (dueSoonRule?.isActive || overdueRule?.isActive) {
      const invoices = await Invoice.find({ schoolId, status: { $in: ["PENDING", "OVERDUE"] } });
      for (const inv of invoices) {
        const student = await Student.findById(inv.studentId).populate("userId");
        if (!student) continue;
        const studentName = (student.userId as any)?.name || "your child";

        if (inv.dueDate < now && overdueRule?.isActive) {
          await notifyParentOfStudent(inv.studentId, "Fee overdue", fillTemplate(overdueRule.messageTemplate, { studentName, amount: String(inv.amount) }), "FINANCE");
        } else if (inv.dueDate >= now && inv.dueDate <= soon && dueSoonRule?.isActive) {
          await notifyParentOfStudent(inv.studentId, "Fee due soon", fillTemplate(dueSoonRule.messageTemplate, { studentName, amount: String(inv.amount), dueDate: inv.dueDate.toLocaleDateString() }), "FINANCE");
        }
      }
    }

    const examRule = ruleFor("EXAM_APPROACHING");
    if (examRule?.isActive) {
      const exams = await Exam.find({ schoolId, date: { $gte: now, $lte: soon } });
      for (const exam of exams) {
        const students = await Student.find({ schoolId, classId: exam.classId, status: "ACTIVE" }).populate("userId");
        for (const student of students) {
          const studentName = (student.userId as any)?.name || "your child";
          await notifyParentOfStudent(student._id, "Exam approaching", fillTemplate(examRule.messageTemplate, { studentName, examName: exam.name, examDate: exam.date.toLocaleDateString() }), "ACADEMIC");
        }
      }
    }

    const assignRule = ruleFor("ASSIGNMENT_DEADLINE_APPROACHING");
    if (assignRule?.isActive) {
      const assignments = await Assignment.find({ schoolId, dueDate: { $gte: now, $lte: soon } });
      for (const a of assignments) {
        const students = await Student.find({ schoolId, classId: a.classId, status: "ACTIVE" }).populate("userId");
        for (const student of students) {
          await notify({
            schoolId,
            userId: (student.userId as any)?._id?.toString(),
            title: "Assignment due soon",
            message: fillTemplate(assignRule.messageTemplate, { assignmentTitle: a.title, dueDate: a.dueDate.toLocaleDateString() }),
            category: "ACADEMIC",
          });
          sent++;
        }
      }
    }

    await AutomationRule.updateMany({ schoolId }, { lastRunAt: new Date() });

    res.json({ success: true, notificationsSent: sent });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
