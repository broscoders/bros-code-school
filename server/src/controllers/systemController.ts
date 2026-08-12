import type { Request, Response } from "express";
import Notification from "../models/Notification";
import DisciplineIncident from "../models/DisciplineIncident";
import { notify } from "../utils/notifier";
import Parent from "../models/Parent";

// Notifications
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const list = await Notification.find({ userId: req.query.userId }).sort({ createdAt: -1 }).limit(30);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markAllRead = async (req: Request, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.body.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Discipline
export const createIncident = async (req: Request, res: Response) => {
  try {
    const incident = await DisciplineIncident.create(req.body);

    if (req.body.parentNotified) {
      const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId: req.body.schoolId,
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

export const getIncidents = async (req: Request, res: Response) => {
  try {
    const list = await DisciplineIncident.find({ schoolId: req.query.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateIncidentStatus = async (req: Request, res: Response) => {
  try {
    const incident = await DisciplineIncident.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
