import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Visitor from "../models/Visitor";
import HealthProfile from "../models/HealthProfile";
import MedicalIncident from "../models/MedicalIncident";

// Visitors
export const checkInVisitor = async (req: AuthRequest, res: Response) => {
  try {
    const visitor = await Visitor.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getVisitors = async (req: AuthRequest, res: Response) => {
  try {
    const visitors = await Visitor.find({ schoolId: req.user!.schoolId }).sort({ checkInTime: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const checkOutVisitor = async (req: AuthRequest, res: Response) => {
  try {
    const visitor = await Visitor.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status: "CHECKED_OUT", checkOutTime: new Date() },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Health profiles (most sensitive data in the system - always scoped to the caller's school)
export const upsertHealthProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await HealthProfile.findOneAndUpdate(
      { studentId: req.body.studentId, schoolId: req.user!.schoolId },
      { ...req.body, schoolId: req.user!.schoolId },
      { upsert: true, new: true }
    );
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getHealthProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await HealthProfile.findOne({ studentId: req.query.studentId as string, schoolId: req.user!.schoolId });
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Medical incidents
export const createMedicalIncident = async (req: AuthRequest, res: Response) => {
  try {
    const incident = await MedicalIncident.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMedicalIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const list = await MedicalIncident.find({ schoolId: req.user!.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ incidentDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

