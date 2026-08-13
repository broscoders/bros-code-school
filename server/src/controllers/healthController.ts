import type { Request, Response } from "express";
import Visitor from "../models/Visitor";
import HealthProfile from "../models/HealthProfile";
import MedicalIncident from "../models/MedicalIncident";

// Visitors
export const checkInVisitor = async (req: Request, res: Response) => {
  try {
    const visitor = await Visitor.create(req.body);
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getVisitors = async (req: Request, res: Response) => {
  try {
    const visitors = await Visitor.find({ schoolId: req.query.schoolId }).sort({ checkInTime: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const checkOutVisitor = async (req: Request, res: Response) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, { status: "CHECKED_OUT", checkOutTime: new Date() }, { new: true });
    if (!visitor) return res.status(404).json({ message: "Visitor not found" });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Health profiles
export const upsertHealthProfile = async (req: Request, res: Response) => {
  try {
    const profile = await HealthProfile.findOneAndUpdate(
      { studentId: req.body.studentId },
      req.body,
      { upsert: true, new: true }
    );
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getHealthProfile = async (req: Request, res: Response) => {
  try {
    const profile = await HealthProfile.findOne({ studentId: req.query.studentId });
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Medical incidents
export const createMedicalIncident = async (req: Request, res: Response) => {
  try {
    const incident = await MedicalIncident.create(req.body);
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMedicalIncidents = async (req: Request, res: Response) => {
  try {
    const list = await MedicalIncident.find({ schoolId: req.query.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ incidentDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
