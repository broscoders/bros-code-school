import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Announcement from "../models/Announcement";
import Student from "../models/Student";
import Parent from "../models/Parent";

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const item = await Announcement.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const filter: Record<string, any> = { schoolId: req.user!.schoolId };

    // The model has a targetAudience field (ALL/PARENTS/STUDENTS/TEACHERS/CLASS)
    // specifically so a TEACHERS-only notice or a single class's notice isn't
    // shown to everyone - this endpoint was never actually applying that
    // filter, so every parent/student saw every announcement in the school
    // regardless of who it was meant for. Staff roles keep full visibility
    // (they legitimately need to see everything going out); the filter only
    // narrows things down for STUDENT and PARENT.
    if (role === "STUDENT") {
      const student = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      filter.$or = [
        { targetAudience: { $in: ["ALL", "STUDENTS"] } },
        ...(student?.classId ? [{ targetAudience: "CLASS", classId: student.classId }] : []),
      ];
    } else if (role === "PARENT") {
      const parent = await Parent.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      const children = parent ? await Student.find({ _id: { $in: parent.children } }) : [];
      const classIds = children.map((c) => c.classId).filter(Boolean);
      filter.$or = [
        { targetAudience: { $in: ["ALL", "PARENTS"] } },
        ...(classIds.length ? [{ targetAudience: "CLASS", classId: { $in: classIds } }] : []),
      ];
    }

    const list = await Announcement.find(filter).sort({ publishAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
