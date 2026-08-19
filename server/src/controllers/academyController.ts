import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import AcademyProgram from "../models/AcademyProgram";
import AcademyBatch from "../models/AcademyBatch";
import AcademyEnrollment from "../models/AcademyEnrollment";

export const createAcademyProgram = async (req: AuthRequest, res: Response) => {
  try {
    const item = await AcademyProgram.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyPrograms = async (req: AuthRequest, res: Response) => {
  try {
    const list = await AcademyProgram.find({ schoolId: req.user!.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createAcademyBatch = async (req: AuthRequest, res: Response) => {
  try {
    const program = await AcademyProgram.findOne({ _id: req.body.programId, schoolId: req.user!.schoolId });
    if (!program) return res.status(404).json({ message: "Program not found" });
    const item = await AcademyBatch.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyBatches = async (req: AuthRequest, res: Response) => {
  try {
    const list = await AcademyBatch.find({ schoolId: req.user!.schoolId, programId: req.query.programId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyAcademyBatches = async (req: AuthRequest, res: Response) => {
  try {
    const list = await AcademyBatch.find({ schoolId: req.user!.schoolId, teacherId: req.query.teacherId as string }).populate("programId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getBatchStudents = async (req: AuthRequest, res: Response) => {
  try {
    const batch = await AcademyBatch.findOne({ _id: req.params.batchId, schoolId: req.user!.schoolId });
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    const enrollments = await AcademyEnrollment.find({ batchId: req.params.batchId, isActive: true }).populate({ path: "studentId", populate: { path: "userId" } });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const enrollInAcademy = async (req: AuthRequest, res: Response) => {
  try {
    const item = await AcademyEnrollment.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const list = await AcademyEnrollment.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string }).populate("batchId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
