import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Event from "../models/Event";

export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find({ schoolId: req.user!.schoolId }).sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
