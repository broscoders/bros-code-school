import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Visitor from "../models/Visitor";
import HealthProfile from "../models/HealthProfile";
import MedicalIncident from "../models/MedicalIncident";
import Parent from "../models/Parent";
import { notify } from "../utils/notifier";

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
    // parentNotified starts false regardless of what the client sends -
    // it's set true below only after a notification is actually created,
    // never just because the nurse said so in the form.
    const { parentNotified, ...safeBody } = req.body;
    const incident = await MedicalIncident.create({ ...safeBody, schoolId: req.user!.schoolId, parentNotified: false });

    // MODERATE severity and above auto-notifies the parent - a minor scrape
    // doesn't need one, but anything past that a parent should hear about
    // the same day, not find out only if they happen to ask.
    if (["MODERATE", "SEVERE", "EMERGENCY"].includes(incident.severity)) {
      const parent = await Parent.findOne({ children: incident.studentId, schoolId: req.user!.schoolId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId: req.user!.schoolId,
          userId: (parent.userId as any)._id.toString(),
          title: incident.severity === "EMERGENCY" ? "Medical emergency - please contact the school" : "Medical incident reported",
          message: `Your child had a ${incident.severity.toLowerCase()} medical incident today. Please check with the school nurse for details.`,
          category: "HEALTH",
        });
        incident.parentNotified = true;
        await incident.save();
      }
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateMedicalIncident = async (req: AuthRequest, res: Response) => {
  try {
    const { status, followUpRequired, followUpNotes } = req.body;
    const incident = await MedicalIncident.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { ...(status ? { status } : {}), ...(followUpRequired !== undefined ? { followUpRequired } : {}), ...(followUpNotes !== undefined ? { followUpNotes } : {}) },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    res.json(incident);
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

