import type { Request, Response } from "express";
import Announcement from "../models/Announcement";
import Admission from "../models/Admission";
import Message from "../models/Message";
import AcademyProgram from "../models/AcademyProgram";
import AcademyBatch from "../models/AcademyBatch";
import AcademyEnrollment from "../models/AcademyEnrollment";

// Announcements
export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const item = await Announcement.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const list = await Announcement.find({ schoolId: req.query.schoolId as string }).sort({ publishAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Admissions
export const createAdmission = async (req: Request, res: Response) => {
  try {
    const item = await Admission.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAdmissions = async (req: Request, res: Response) => {
  try {
    const list = await Admission.find({ schoolId: req.query.schoolId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateAdmissionStatus = async (req: Request, res: Response) => {
  try {
    const item = await Admission.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!item) return res.status(404).json({ message: "Admission not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Messages
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const msg = await Message.create(req.body);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const msgs = await Message.find({
      $or: [{ fromUserId: req.query.userId as string }, { toUserId: req.query.userId as string }],
    }).sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Academy
export const createAcademyProgram = async (req: Request, res: Response) => {
  try {
    const item = await AcademyProgram.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyPrograms = async (req: Request, res: Response) => {
  try {
    const list = await AcademyProgram.find({ schoolId: req.query.schoolId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createAcademyBatch = async (req: Request, res: Response) => {
  try {
    const item = await AcademyBatch.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyBatches = async (req: Request, res: Response) => {
  try {
    const list = await AcademyBatch.find({ programId: req.query.programId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const enrollInAcademy = async (req: Request, res: Response) => {
  try {
    const item = await AcademyEnrollment.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyEnrollments = async (req: Request, res: Response) => {
  try {
    const list = await AcademyEnrollment.find({ studentId: req.query.studentId as string }).populate("batchId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
