import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Announcement from "../models/Announcement";
import Student from "../models/Student";
import Parent from "../models/Parent";
import ClassModel from "../models/ClassModel";

export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const title = String(req.body.title || "").trim();
    const message = String(req.body.message || "").trim();
    const { targetAudience, classId, priority } = req.body;
    if (!title || !message) return res.status(400).json({ message: "Title and message are required" });
    if (!["ALL", "PARENTS", "STUDENTS", "TEACHERS", "CLASS", "ACADEMY"].includes(targetAudience)) {
      return res.status(400).json({ message: "Please choose who the announcement is for" });
    }
    if (priority && !["NORMAL", "HIGH", "URGENT"].includes(priority)) return res.status(400).json({ message: "Invalid priority" });
    if (targetAudience === "CLASS") {
      if (!classId) return res.status(400).json({ message: "Please choose a class" });
      if (!(await ClassModel.exists({ _id: classId, schoolId }))) return res.status(404).json({ message: "Class not found in your school" });
    }
    const publishAt = req.body.publishAt ? new Date(req.body.publishAt) : new Date();
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : undefined;
    if (Number.isNaN(publishAt.getTime()) || (expiresAt && Number.isNaN(expiresAt.getTime()))) return res.status(400).json({ message: "Invalid date" });
    // an expiry date at midnight of "today" would hide the notice immediately -
    // treat the chosen day as valid until the end of that day
    if (expiresAt) expiresAt.setHours(23, 59, 59, 999);
    if (expiresAt && expiresAt <= publishAt) return res.status(400).json({ message: "The expiry date must be after the publish date" });

    // createdBy is the logged-in user (the browser used to send it)
    const item = await Announcement.create({
      schoolId, title, message, targetAudience,
      classId: targetAudience === "CLASS" ? classId : undefined,
      priority: priority || "NORMAL", publishAt, expiresAt, createdBy: req.user!.userId,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// There was no way to remove an announcement - a wrong or outdated notice
// stayed visible to every parent until its expiry date (if it had one).
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const item = await Announcement.findOneAndDelete({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!item) return res.status(404).json({ message: "Announcement not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const now = new Date();
    const filter: Record<string, any> = {
      schoolId: req.user!.schoolId,
      // Blueprint 56: respect the publish/expiry window instead of showing
      // everything ever created regardless of scheduling.
      publishAt: { $lte: now },
      $and: [{ $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }] }],
    };

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
