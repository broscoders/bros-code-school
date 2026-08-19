import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Event from "../models/Event";
import Exam from "../models/Exam";
import PTMSlot from "../models/PTMSlot";
import AuditLog from "../models/AuditLog";

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
