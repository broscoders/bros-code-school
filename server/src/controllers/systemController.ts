import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Notification from "../models/Notification";
import DisciplineIncident from "../models/DisciplineIncident";
import { notify } from "../utils/notifier";
import Parent from "../models/Parent";
import Student from "../models/Student";

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Notification.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(30);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.userId }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createIncident = async (req: AuthRequest, res: Response) => {
  try {
    const belongsToSchool = await Student.findOne({ _id: req.body.studentId, schoolId: req.user!.schoolId });
    if (!belongsToSchool) return res.status(404).json({ message: "Student not found in your school" });

    const incident = await DisciplineIncident.create({ ...req.body, schoolId: req.user!.schoolId });

    if (req.body.parentNotified) {
      const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId: req.user!.schoolId,
          userId: (parent.userId as any)._id.toString(),
          title: "Discipline notice",
          message: `A discipline incident has been recorded for your child. Please check the portal for details.`,
          category: "SYSTEM",
        });
      }
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const list = await DisciplineIncident.find({ schoolId: req.user!.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateIncidentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await DisciplineIncident.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      req.body,
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
