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

  // Admin/staff: a thin "student/teacher counts" summary isn't the
  // "insights" the blueprint calls for (at-risk students, attendance/fee
  // trends). Compute those here so the assistant can actually answer
  // questions like "which students are at risk" or "how's attendance
  // trending" instead of only ever seeing raw counts.
  const studentCount = await Student.countDocuments({ schoolId, status: "ACTIVE" });
  const teacherCount = await Teacher.countDocuments({ schoolId });
  const pendingFees = await Invoice.countDocuments({ schoolId, status: { $ne: "PAID" } });
  const upcomingExams = await Exam.find({ schoolId }).sort({ date: 1 }).limit(5);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // At-risk students: attendance rate below 75% over the last 30 days.
  // A single aggregation instead of one query per student keeps this fast
  // even for a large school, since this recomputes on every AI message.
  const attendanceAgg = await Attendance.aggregate([
    { $match: { date: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: "$studentId",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $in: ["$status", ["PRESENT", "LATE"]] }, 1, 0] } },
      },
    },
    { $match: { total: { $gte: 5 } } },
    { $addFields: { rate: { $divide: ["$present", "$total"] } } },
    { $match: { rate: { $lt: 0.75 } } },
    { $sort: { rate: 1 } },
    { $limit: 15 },
    { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
    { $match: { "student.schoolId": schoolId } },
    { $lookup: { from: "users", localField: "student.userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $lookup: { from: "classmodels", localField: "student.classId", foreignField: "_id", as: "class" } },
  ]);
  const atRisk = attendanceAgg.map((r: any) => `${r.user?.name} (${r.class?.[0]?.name || "?"}) - ${Math.round(r.rate * 100)}% attendance`);

  // Attendance trend: this week vs the prior 3 weeks, school-wide.
  const [recentAttendance, olderAttendance] = await Promise.all([
    Attendance.find({ schoolId, date: { $gte: sevenDaysAgo } }),
    Attendance.find({ schoolId, date: { $gte: thirtyDaysAgo, $lt: sevenDaysAgo } }),
  ]);
  const rateOf = (records: any[]) => (records.length ? Math.round((records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length / records.length) * 100) : null);
  const recentRate = rateOf(recentAttendance);
  const olderRate = rateOf(olderAttendance);

  // Fee trend: collected vs pending this month.
  const invoicesThisMonth = await Invoice.find({ schoolId, createdAt: { $gte: thirtyDaysAgo } });
  const totalDue = invoicesThisMonth.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalCollected = invoicesThisMonth.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  const overdueCount = await Invoice.countDocuments({ schoolId, status: "PENDING", dueDate: { $lt: new Date() } });

  // Academic trend: average result percentage from recently published exams.
  const recentResults = await Result.find({ schoolId, isPublished: true }).sort({ createdAt: -1 }).limit(200).populate("examId");
  let avgPercent: number | null = null;
  if (recentResults.length) {
    const percents = recentResults
      .map((r) => {
        const total = (r.examId as any)?.totalMarks;
        return total ? (r.marksObtained / total) * 100 : null;
      })
      .filter((p): p is number => p !== null);
    if (percents.length) avgPercent = Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);
  }

  return `School overview: ${studentCount} active students, ${teacherCount} teachers, ${pendingFees} pending fee invoices (${overdueCount} overdue).
Upcoming Exams: ${JSON.stringify(upcomingExams.map((e) => ({ name: e.name, date: e.date })))}
At-risk students (attendance under 75% in the last 30 days): ${atRisk.length ? atRisk.join("; ") : "None currently flagged"}
Attendance trend: this week ${recentRate !== null ? recentRate + "%" : "no data"}, prior 3 weeks ${olderRate !== null ? olderRate + "%" : "no data"}
Fee trend (last 30 days): Rs. ${totalCollected} collected of Rs. ${totalDue} invoiced
Academic trend: average result score across recent published exams is ${avgPercent !== null ? avgPercent + "%" : "no published results yet"}`;
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
