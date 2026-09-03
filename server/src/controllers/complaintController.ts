import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Complaint from "../models/Complaint";

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    // Reachable by EVERYONE (including parents/students) to file a
    // complaint, but only front-desk staff should move it through its
    // status workflow (see updateComplaintStatus) - stripping these keeps
    // a complainant from marking their own complaint resolved/closed.
    const { status, ...safeBody } = req.body;
    const ticketNumber = "SC-" + Date.now().toString(36).toUpperCase();
    const complaint = await Complaint.create({
      ...safeBody,
      schoolId: req.user!.schoolId,
      raisedBy: req.user!.userId,
      ticketNumber,
    });
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
