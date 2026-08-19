import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Complaint from "../models/Complaint";

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    const ticketNumber = "SC-" + Math.floor(1000 + Math.random() * 9000);
    const complaint = await Complaint.create({ ...req.body, schoolId: req.user!.schoolId, ticketNumber });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const complaints = await Complaint.find({ schoolId: req.user!.schoolId });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
  try {
    const complaint = await Complaint.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status: req.body.status },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
