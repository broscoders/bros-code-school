import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import AcademicSession from "../models/AcademicSession";
import ClassModel from "../models/ClassModel";
import Section from "../models/Section";
import Subject from "../models/Subject";

// Academic Session
export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const session = await AcademicSession.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await AcademicSession.find({ schoolId: req.user!.schoolId });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Class
export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const newClass = await ClassModel.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const classes = await ClassModel.find({ schoolId: req.user!.schoolId });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Section
export const createSection = async (req: AuthRequest, res: Response) => {
  try {
    const section = await Section.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSections = async (req: AuthRequest, res: Response) => {
  try {
    const sections = await Section.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Subject
export const createSubject = async (req: AuthRequest, res: Response) => {
  try {
    const subject = await Subject.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSubjects = async (req: AuthRequest, res: Response) => {
  try {
    const subjects = await Subject.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
