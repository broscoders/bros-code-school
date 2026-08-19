import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Admission from "../models/Admission";

export const createAdmission = async (req: AuthRequest, res: Response) => {
  try {
    const item = await Admission.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAdmissions = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Admission.find({ schoolId: req.user!.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateAdmissionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const item = await Admission.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status: req.body.status },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Admission not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
