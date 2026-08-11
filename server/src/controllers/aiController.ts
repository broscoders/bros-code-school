import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Parent from "../models/Parent";
import Homework from "../models/Homework";
import Assignment from "../models/Assignment";
import Attendance from "../models/Attendance";
import Result from "../models/Result";
import Exam from "../models/Exam";
import Invoice from "../models/Invoice";

async function buildContext(req: AuthRequest, studentIdParam?: string): Promise<string> {
  const { userId, role, schoolId } = req.user!;

  if (role === "STUDENT") {
    const student = await Student.findOne({ userId }).populate("classId sectionId");
    if (!student) return "No student record found.";
    const homework = await Homework.find({ classId: student.classId }).limit(10);
    const assignments = await Assignment.find({ classId: student.classId }).limit(10);
    const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 }).limit(10);
    const results = await Result.find({ studentId: student._id }).populate("examId").limit(10);
    return `Student admission number: ${student.admissionNumber}, Class: ${(student.classId as any)?.name}.
Homework: ${JSON.stringify(homework.map((h) => ({ title: h.title, due: h.dueDate })))}
Assignments: ${JSON.stringify(assignments.map((a) => ({ title: a.title, due: a.dueDate })))}
Recent Attendance: ${JSON.stringify(attendance.map((a) => ({ date: a.date, status: a.status })))}
Results: ${JSON.stringify(results.map((r) => ({ exam: (r.examId as any)?.name, marks: r.marksObtained })))}`;
  }

  if (role === "PARENT") {
    const parent = await Parent.findOne({ userId }).populate("children");
    if (!parent) return "No parent record found.";
    let targetId = parent.children[0]?.toString();
    if (studentIdParam && parent.children.some((c: any) => c.toString() === studentIdParam)) {
      targetId = studentIdParam;
    }
    if (!targetId) return "No children linked to this account.";
    const student = await Student.findById(targetId).populate("classId userId");
    if (!student) return "Child record not found.";
    const homework = await Homework.find({ classId: student.classId }).limit(10);
    const attendance = await Attendance.find({ studentId: student._id }).sort({ date: -1 }).limit(10);
    const results = await Result.find({ studentId: student._id }).populate("examId").limit(10);
    const invoices = await Invoice.find({ studentId: student._id }).limit(10);
    return `Child: ${(student.userId as any)?.name}, Class: ${(student.classId as any)?.name}.
Homework: ${JSON.stringify(homework.map((h) => ({ title: h.title, due: h.dueDate })))}
Recent Attendance: ${JSON.stringify(attendance.map((a) => ({ date: a.date, status: a.status })))}
Results: ${JSON.stringify(results.map((r) => ({ exam: (r.examId as any)?.name, marks: r.marksObtained })))}
Fees: ${JSON.stringify(invoices.map((i) => ({ type: i.feeType, amount: i.amount, status: i.status })))}`;
  }

  if (role === "TEACHER" || role === "ACADEMY_TEACHER") {
    const teacher = await Teacher.findOne({ userId }).populate("assignedClasses subjects");
    if (!teacher) return "No teacher record found.";
    const classIds = teacher.assignedClasses.map((c: any) => c._id);
    const homework = await Homework.find({ classId: { $in: classIds } }).limit(10);
    const assignments = await Assignment.find({ classId: { $in: classIds } }).limit(10);
    return `Teacher assigned classes: ${teacher.assignedClasses.map((c: any) => c.name).join(", ")}.
Recent Homework: ${JSON.stringify(homework.map((h) => ({ title: h.title })))}
Recent Assignments: ${JSON.stringify(assignments.map((a) => ({ title: a.title })))}`;
  }

  const studentCount = await Student.countDocuments({ schoolId });
  const teacherCount = await Teacher.countDocuments({ schoolId });
  const pendingFees = await Invoice.countDocuments({ schoolId, status: { $ne: "PAID" } });
  const upcomingExams = await Exam.find({ schoolId }).sort({ date: 1 }).limit(5);
  return `School overview: ${studentCount} students, ${teacherCount} teachers, ${pendingFees} pending fee invoices.
Upcoming Exams: ${JSON.stringify(upcomingExams.map((e) => ({ name: e.name, date: e.date })))}`;
}

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  try {
    const { message, studentId } = req.body;
    if (!message) return res.status(400).json({ message: "Message is required" });

    const context = await buildContext(req, studentId);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "AI is not configured. Missing GROQ_API_KEY in .env" });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are the school assistant for Bros Code School. Answer only using the data provided below. Never invent information. If the data does not contain the answer, say you don't have that information.\n\nDATA:\n${context}`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.3,
      }),
    });

    const data: any = await response.json();
    if (!response.ok) {
      return res.status(500).json({ message: "AI service error", error: data });
    }

    const reply = data.choices?.[0]?.message?.content || "Sorry, I could not generate a response.";
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
