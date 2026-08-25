import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Achievement from "../models/Achievement";
import { canAccessStudent } from "../utils/accessControl";

export const addAchievement = async (req: AuthRequest, res: Response) => {
  try {
    const achievement = await Achievement.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(achievement);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const list = await Achievement.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
