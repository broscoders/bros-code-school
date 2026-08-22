import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Message from "../models/Message";
import PTMSlot from "../models/PTMSlot";
import Parent from "../models/Parent";
import { canAccessStudent } from "../utils/accessControl";
import LeaveRequest from "../models/LeaveRequest";
import StudyMaterial from "../models/StudyMaterial";
import Teacher from "../models/Teacher";

// Messages
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const msg = await Message.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getThread = async (req: AuthRequest, res: Response) => {
  try {
    const userA = req.query.userA as string;
    const userB = req.query.userB as string;
    const msgs = await Message.find({
      schoolId: req.user!.schoolId,
      $or: [
        { fromUserId: userA, toUserId: userB },
        { fromUserId: userB, toUserId: userA },
      ],
    }).sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getInbox = async (req: AuthRequest, res: Response) => {
  try {
    const msgs = await Message.find({ schoolId: req.user!.schoolId, toUserId: req.query.userId as string }).populate("fromUserId").sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Teacher communication hours
export const setCommunicationHours = async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { communicationHours: req.body.communicationHours },
      { new: true }
    );
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// PTM
export const createPTMSlot = async (req: AuthRequest, res: Response) => {
  try {
    const slot = await PTMSlot.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getPTMSlotsByTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const slots = await PTMSlot.find({ schoolId: req.user!.schoolId, teacherId: req.query.teacherId as string }).populate("parentId studentId");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAllTeacherSlots = async (req: AuthRequest, res: Response) => {
  try {
    const slots = await PTMSlot.find({ schoolId: req.user!.schoolId, isBooked: false }).populate("teacherId");
    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const bookPTMSlot = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.body.studentId);
    if (!allowed) return res.status(403).json({ message: "You do not have access to book on behalf of this student" });

    let parentId = req.body.parentId;
    if (req.user!.role === "PARENT") {
      const myParent = await Parent.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myParent) return res.status(403).json({ message: "Parent profile not found" });
      parentId = myParent._id.toString();
    }

    const slot = await PTMSlot.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId, isBooked: false },
      { parentId, studentId: req.body.studentId, isBooked: true },
      { new: true }
    );
    if (!slot) return res.status(409).json({ message: "This slot was just booked by someone else. Please pick another time." });
    res.json(slot);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Leave Requests
export const createLeaveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const leave = await LeaveRequest.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getLeaveRequests = async (req: AuthRequest, res: Response) => {
  try {
    const leaves = await LeaveRequest.find({ schoolId: req.user!.schoolId }).populate("studentId teacherId requestedBy");
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const leave = await LeaveRequest.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status: req.body.status },
      { new: true }
    );
    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Study Material
export const addStudyMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const material = await StudyMaterial.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStudyMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const list = await StudyMaterial.find({ schoolId: req.user!.schoolId, classId: req.query.classId as string }).populate("subjectId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
