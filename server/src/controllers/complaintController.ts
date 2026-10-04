import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Complaint from "../models/Complaint";

const CATEGORIES = ["ACADEMIC", "FEE", "TRANSPORT", "TEACHER", "GENERAL", "TECHNICAL"];
const STATUSES = ["OPEN", "IN_REVIEW", "RESOLVED"];

export const createComplaint = async (req: AuthRequest, res: Response) => {
  try {
    // Reachable by EVERYONE (including parents/students) to file a
    // complaint, but only front-desk staff move it through its status
    // workflow. Only these three fields are accepted from the client now.
    const { category, subject, description } = req.body;
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: "Please choose a valid category" });
    if (!subject || !String(subject).trim() || !description || !String(description).trim()) {
      return res.status(400).json({ message: "Subject and description are required" });
    }
    // Date.now() alone can collide when two tickets are filed in the same
    // millisecond (ticketNumber is unique), so add a random suffix.
    const ticketNumber = "SC-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    const complaint = await Complaint.create({
      schoolId: req.user!.schoolId,
      raisedBy: req.user!.userId,
      category,
      subject: String(subject).trim(),
      description: String(description).trim(),
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

// "My Tickets" - anyone can file a complaint (createComplaint is open to
// EVERYONE) but until now there was no way for them to see it again
// afterwards; only front-desk staff could list complaints at all.
export const getMyComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const complaints = await Complaint.find({ schoolId: req.user!.schoolId, raisedBy: req.user!.userId }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!STATUSES.includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
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
