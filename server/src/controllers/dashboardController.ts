import type { Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "../middleware/authMiddleware";
import Event from "../models/Event";
import Exam from "../models/Exam";
import PTMSlot from "../models/PTMSlot";
import AuditLog from "../models/AuditLog";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Admission from "../models/Admission";
import Announcement from "../models/Announcement";
import Invoice from "../models/Invoice";

export const getUnifiedCalendar = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;

    const [events, exams, ptmSlots] = await Promise.all([
      Event.find({ schoolId }),
      Exam.find({ schoolId }).populate("classId subjectId"),
      PTMSlot.find({ schoolId, isBooked: true }).populate("teacherId"),
    ]);

    const items = [
      ...events.map((e) => ({ id: e._id, title: e.title, date: e.date, type: e.eventType })),
      ...exams.map((e) => ({ id: e._id, title: `${e.name} - ${(e.subjectId as any)?.name || ""}`, date: e.date, type: "EXAM" })),
      ...ptmSlots.map((p) => ({ id: p._id, title: `PTM with ${(p.teacherId as any)?.employeeId || "teacher"}`, date: p.date, type: "PTM" })),
    ];

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getActivityFeed = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.find({ schoolId: req.user!.schoolId }).sort({ createdAt: -1 }).limit(10);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// One lightweight call for the whole admin dashboard. Before, the page
// downloaded EVERY student, teacher, admission, announcement, event, exam and
// PTM slot (with populated references) just to show four numbers and a few
// short lists, and the charts were hardcoded sample figures. Everything here
// is a count/aggregate computed by the database, with small limits.
export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const oid = new mongoose.Types.ObjectId(schoolId); // aggregate() does not auto-cast ids
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const canSeeFees = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACCOUNTANT"].includes(req.user!.role);

    const [students, teachers, stageCounts, announcements, events, exams, activity, enrolledBefore, enrolledByMonth, feeAgg] =
      await Promise.all([
        Student.countDocuments({ schoolId, status: "ACTIVE" }),
        Teacher.countDocuments({ schoolId }),
        Admission.aggregate([{ $match: { schoolId: oid } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
        Announcement.countDocuments({
          schoolId,
          publishAt: { $lte: now },
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
        }),
        Event.find({ schoolId, date: { $gte: startOfToday } }).sort({ date: 1 }).limit(4).select("title date eventType").lean(),
        Exam.find({ schoolId, date: { $gte: startOfToday } }).sort({ date: 1 }).limit(4).select("name date").lean(),
        AuditLog.find({ schoolId }).sort({ createdAt: -1 }).limit(5).select("userName action createdAt").lean(),
        Student.countDocuments({ schoolId, createdAt: { $lt: sixMonthsAgo } }),
        Student.aggregate([
          { $match: { schoolId: oid, createdAt: { $gte: sixMonthsAgo } } },
          { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, n: { $sum: 1 } } },
        ]),
        canSeeFees
          ? Invoice.aggregate([
              { $match: { schoolId: oid, status: { $ne: "CANCELLED" } } },
              { $group: { _id: "$status", amount: { $sum: "$amount" }, paid: { $sum: { $ifNull: ["$paidAmount", 0] } } } },
            ])
          : Promise.resolve([]),
      ]);

    const stage: Record<string, number> = {};
    (stageCounts as any[]).forEach((r) => (stage[r._id] = r.n));

    // Cumulative enrollment over the last 6 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const byKey = new Map<string, number>();
    (enrolledByMonth as any[]).forEach((r) => byKey.set(`${r._id.y}-${r._id.m}`, r.n));
    let running = enrolledBefore;
    const enrollmentTrend: { month: string; students: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      running += byKey.get(`${d.getFullYear()}-${d.getMonth() + 1}`) || 0;
      enrollmentTrend.push({ month: monthNames[d.getMonth()], students: running });
    }

    // Fee overview (amounts), only for roles that may see money figures
    let fees: { collected: number; pending: number; overdue: number } | null = null;
    if (canSeeFees) {
      const f = { collected: 0, pending: 0, overdue: 0 };
      (feeAgg as any[]).forEach((r) => {
        f.collected += r.paid;
        const due = Math.max(0, r.amount - r.paid);
        if (r._id === "OVERDUE") f.overdue += due;
        else if (r._id !== "PAID") f.pending += due;
      });
      fees = f;
    }

    const upcoming = [
      ...(events as any[]).map((e) => ({ id: e._id, title: e.title, date: e.date, type: e.eventType })),
      ...(exams as any[]).map((e) => ({ id: e._id, title: e.name, date: e.date, type: "EXAM" })),
    ]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);

    res.json({
      counts: {
        students,
        teachers,
        pendingAdmissions: (stage.APPLICATION || 0) + (stage.REVIEW || 0),
        announcements,
      },
      admissionFunnel: [
        { stage: "Applications", count: stage.APPLICATION || 0 },
        { stage: "In review", count: stage.REVIEW || 0 },
        { stage: "Interview", count: stage.INTERVIEW || 0 },
        { stage: "Approved", count: stage.APPROVED || 0 },
        { stage: "Admitted", count: stage.CONVERTED || 0 },
      ],
      enrollmentTrend,
      fees,
      upcoming,
      activity,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
