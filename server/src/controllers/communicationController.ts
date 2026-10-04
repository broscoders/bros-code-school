import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Message from "../models/Message";
import User from "../models/User";
import Teacher from "../models/Teacher";
import PTMSlot from "../models/PTMSlot";
import Parent from "../models/Parent";
import { canAccessStudent, isAssignedToClass, isOwnClass } from "../utils/accessControl";
import Subject from "../models/Subject";
import LeaveRequest from "../models/LeaveRequest";
import StudyMaterial from "../models/StudyMaterial";

// Messages
const BLOCKED_PEER_PAIRS = new Set(["STUDENT-STUDENT", "PARENT-PARENT"]);

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const fromUserId = req.user!.userId;
    const { toUserId } = req.body;

    if (!toUserId) return res.status(400).json({ message: "toUserId is required" });
    if (toUserId === fromUserId) return res.status(400).json({ message: "You cannot message yourself" });

    const recipient = await User.findOne({ _id: toUserId, schoolId });
    if (!recipient) return res.status(404).json({ message: "Recipient not found in your school" });

    const pairKey = `${req.user!.role}-${recipient.role}`;
    if (BLOCKED_PEER_PAIRS.has(pairKey)) {
      return res.status(403).json({ message: "You are not authorized to message this type of user directly" });
    }

    const msg = await Message.create({ ...req.body, fromUserId, schoolId });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getThread = async (req: AuthRequest, res: Response) => {
  try {
    const userA = req.query.userA as string;
    const userB = req.query.userB as string;
    // Without this check, any logged-in user could read the private
    // conversation between any two OTHER users just by knowing/guessing
    // their user IDs - neither userA nor userB was ever checked against
    // who was actually making the request.
    if (req.user!.userId !== userA && req.user!.userId !== userB) {
      return res.status(403).json({ message: "You can only view your own conversations" });
    }
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
    // Always the caller's own inbox - a client-supplied userId query param
    // would otherwise let anyone read anyone else's received messages.
    const msgs = await Message.find({ schoolId: req.user!.schoolId, toUserId: req.user!.userId }).populate("fromUserId").sort({ createdAt: -1 });
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
    const teacherId = req.query.teacherId as string;
    const role = req.user!.role;
    const STAFF_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR", "RECEPTIONIST"];

    // This returns which parent/student is booked into each slot for a
    // teacher - real, private booking info. Route allows every role, so
    // without this check any parent/student could pass an arbitrary
    // teacherId and see every other family's PTM bookings with that
    // teacher, not just their own.
    if (role === "TEACHER" || role === "ACADEMY_TEACHER") {
      const myTeacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myTeacher || myTeacher._id.toString() !== teacherId) {
        return res.status(403).json({ message: "You can only view your own PTM slots" });
      }
    } else if (!STAFF_ROLES.includes(role)) {
      return res.status(403).json({ message: "You are not authorized to view this teacher's full slot list" });
    }

    const slots = await PTMSlot.find({ schoolId: req.user!.schoolId, teacherId }).populate("parentId studentId");
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
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;

    if (req.body.type === "STUDENT") {
      const allowed = await canAccessStudent(req, req.body.studentId);
      if (!allowed) return res.status(403).json({ message: "You do not have access to request leave for this student" });
    } else if (req.body.type === "TEACHER") {
      const myTeacher = await Teacher.findOne({ userId: req.user!.userId, schoolId });
      if (!myTeacher) return res.status(403).json({ message: "Only teachers can request teacher leave" });
      req.body.teacherId = myTeacher._id;
    }

    // Leave requests can only ever be approved via updateLeaveStatus (a
    // separate, more-privileged endpoint) - without stripping these here, a
    // teacher or parent could self-approve their own leave request just by
    // including "status": "APPROVED" in this request body.
    const { status, ...safeBody } = req.body;
    const leave = await LeaveRequest.create({ ...safeBody, requestedBy: req.user!.userId, schoolId });
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
    const existing = await LeaveRequest.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!existing) return res.status(404).json({ message: "Leave request not found" });

    // ACADEMIC_STAFF (who can approve) overlaps with TEACHING_STAFF (who
    // can request) for Head/Academic Coordinator/Top Admin - without this,
    // one of them could approve their own leave request.
    if (existing.requestedBy.toString() === req.user!.userId) {
      return res.status(403).json({ message: "You cannot approve your own leave request. Ask another admin to review it." });
    }

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
    const schoolId = req.user!.schoolId;
    const { classId, subjectId, title, chapter, fileUrl } = req.body;
    if (!classId || !subjectId || !title || !fileUrl) {
      return res.status(400).json({ message: "Class, subject, title and file are required" });
    }
    if (!/^https?:\/\//i.test(String(fileUrl))) return res.status(400).json({ message: "Invalid file link" });
    if (!(await isAssignedToClass(req, classId))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }
    const subject = await Subject.findOne({ _id: subjectId, classId, schoolId });
    if (!subject) return res.status(404).json({ message: "Subject not found in this class" });
    // teacherId comes from the login, never from the request body
    const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId });
    if (!teacher) return res.status(403).json({ message: "Only users with a teacher profile can upload study material" });

    const material = await StudyMaterial.create({ schoolId, classId, subjectId, teacherId: teacher._id, title, chapter, fileUrl });
    res.status(201).json(material);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStudyMaterial = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.query.classId as string | undefined;
    if (!classId) return res.status(400).json({ message: "classId is required" });
    const role = req.user!.role;
    if ((role === "STUDENT" || role === "PARENT") && !(await isOwnClass(req, classId))) {
      return res.status(403).json({ message: "You can only view study material of your own class" });
    }
    if (!(await isAssignedToClass(req, classId))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }
    const list = await StudyMaterial.find({ schoolId: req.user!.schoolId, classId }).populate("subjectId").sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
