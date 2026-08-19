import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Announcement from "../models/Announcement";

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
    const list = await Announcement.find({ schoolId: req.user!.schoolId }).sort({ publishAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
