import type { Request, Response } from "express";
import AcademicSession from "../models/AcademicSession";
import ClassModel from "../models/ClassModel";
import Section from "../models/Section";
import Subject from "../models/Subject";

// Academic Session
export const createSession = async (req: Request, res: Response) => {
  try {
    const session = await AcademicSession.create(req.body);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await AcademicSession.find({ schoolId: req.query.schoolId as string });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Class
export const createClass = async (req: Request, res: Response) => {
  try {
    const newClass = await ClassModel.create(req.body);
    res.status(201).json(newClass);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await ClassModel.find({ schoolId: req.query.schoolId as string });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Section
export const createSection = async (req: Request, res: Response) => {
  try {
    const section = await Section.create(req.body);
    res.status(201).json(section);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSections = async (req: Request, res: Response) => {
  try {
    const sections = await Section.find({ classId: req.query.classId as string });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Subject
export const createSubject = async (req: Request, res: Response) => {
  try {
    const subject = await Subject.create(req.body);
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await Subject.find({ classId: req.query.classId as string });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
