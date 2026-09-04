import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import { canAccessStudent } from "../utils/accessControl";
import Parent from "../models/Parent";
import Teacher from "../models/Teacher";
import Section from "../models/Section";
import User from "../models/User";
import { logAudit } from "../utils/auditLogger";

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    if (req.body.sectionId) {
      const section = await Section.findOne({ _id: req.body.sectionId, schoolId: req.user!.schoolId });
      if (!section) return res.status(404).json({ message: "Section not found" });
      if (section.capacity) {
        const currentCount = await Student.countDocuments({ sectionId: req.body.sectionId, schoolId: req.user!.schoolId, status: "ACTIVE" });
        if (currentCount >= section.capacity) {
          return res.status(400).json({ message: `Section "${section.name}" is at full capacity (${section.capacity} students).` });
        }
      }
    }

    const student = await Student.create({
      ...req.body,
      schoolId: req.user!.schoolId,
      classHistory: req.body.classId && req.body.sectionId
        ? [{ classId: req.body.classId, sectionId: req.body.sectionId, fromDate: new Date() }]
        : [],
    });
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { schoolId: req.user!.schoolId };
    const status = req.query.status as string | undefined;
    if (!status || status === "ACTIVE") filter.status = "ACTIVE";
    else if (status !== "ANY") filter.status = status;

    const role = req.user!.role;
    // This list had no per-role scoping at all - any PARENT or STUDENT
    // could hit it and get every student in the school (name, email via
    // populated userId, class). Staff keep full visibility; a parent only
    // gets their own children, and a student only gets their own record.
    if (role === "PARENT") {
      const parent = await Parent.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      filter._id = { $in: parent?.children || [] };
    } else if (role === "STUDENT") {
      const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      filter._id = myStudent?._id || null;
    }

    const students = await Student.find(filter).populate("userId classId sectionId");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, String(req.params.id));
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user!.schoolId }).populate("userId classId sectionId parentId classHistory.classId classHistory.sectionId");
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateStudentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TRANSFERRED", "WITHDRAWN", "GRADUATED", "ALUMNI", "ARCHIVED"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const oldStatus = student.status;
    student.status = status;
    student.statusReason = reason;
    student.statusChangedAt = new Date();
    await student.save();

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: (req.body.changedByName as string) || "Unknown",
        userRole: req.user.role,
        action: `Changed student status: ${oldStatus} -> ${status}`,
        recordType: "Student",
        recordId: student._id.toString(),
        oldValue: { status: oldStatus },
        newValue: { status, reason },
      });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const transferStudent = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, sectionId } = req.body;
    const student = await Student.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const newSection = await Section.findOne({ _id: sectionId, schoolId: req.user!.schoolId });
    if (!newSection) return res.status(404).json({ message: "Target section not found" });
    if (newSection.capacity) {
      const currentCount = await Student.countDocuments({ sectionId, schoolId: req.user!.schoolId, status: "ACTIVE" });
      if (currentCount >= newSection.capacity) {
        return res.status(400).json({ message: `Section "${newSection.name}" is at full capacity.` });
      }
    }

    const oldClassId = student.classId;
    const oldSectionId = student.sectionId;

    const openEntry = student.classHistory.find((h) => !h.toDate);
    if (openEntry) openEntry.toDate = new Date();

    student.classId = classId;
    student.sectionId = sectionId;
    student.classHistory.push({ classId, sectionId, fromDate: new Date() });
    await student.save();

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: (req.body.changedByName as string) || "Unknown",
        userRole: req.user.role,
        action: "Transferred student to a new class/section",
        recordType: "Student",
        recordId: student._id.toString(),
        oldValue: { classId: oldClassId, sectionId: oldSectionId },
        newValue: { classId, sectionId },
      });
    }

    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createParent = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, children, relationship } = req.body;

    // A parent account is meant to support multiple children - if this
    // userId already has a Parent profile (they were already linked to
    // one child and are now being linked to another, or a previous attempt
    // partially failed after the User account was created but before this
    // profile was), merge the new children into the existing record
    // instead of trying to create a second Parent document for the same
    // person, which the frontend has no way to recover from.
    const existing = await Parent.findOne({ userId, schoolId: req.user!.schoolId });
    if (existing) {
      const merged = Array.from(new Set([...existing.children.map((c) => c.toString()), ...(children || [])]));
      existing.children = merged as any;
      if (relationship) existing.relationship = relationship;
      await existing.save();
      return res.json(existing);
    }

    const parent = await Parent.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(parent);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Lets the frontend recover when "create parent" hits an email that
// already belongs to an existing account: rather than dead-ending on
// "user already exists", it can look up that account's Parent profile (if
// any) and link the new child to it instead.
export const findParentByEmail = async (req: AuthRequest, res: Response) => {
  try {
    const email = req.query.email as string;
    const user = await User.findOne({ email, schoolId: req.user!.schoolId, role: "PARENT" });
    if (!user) return res.status(404).json({ message: "No parent account found with this email" });

    const parent = await Parent.findOne({ userId: user._id, schoolId: req.user!.schoolId });
    res.json({ userId: user._id, name: user.name, email: user.email, parent: parent || null });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getParents = async (req: AuthRequest, res: Response) => {
  try {
    const parents = await Parent.find({ schoolId: req.user!.schoolId }).populate("userId children");
    res.json(parents);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { schoolId: req.user!.schoolId };
    const status = req.query.status as string | undefined;
    if (!status || status === "ACTIVE") filter.employmentStatus = "ACTIVE";
    else if (status !== "ANY") filter.employmentStatus = status;

    const teachers = await Teacher.find(filter).populate("userId subjects assignedClasses");
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateTeacherStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { employmentStatus, reason } = req.body;
    const valid = ["ACTIVE", "ON_LEAVE", "TRANSFERRED", "RESIGNED", "TERMINATED"];
    if (!valid.includes(employmentStatus)) return res.status(400).json({ message: "Invalid status" });

    const teacher = await Teacher.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const oldStatus = teacher.employmentStatus;
    teacher.employmentStatus = employmentStatus;
    teacher.statusReason = reason;
    if (["RESIGNED", "TERMINATED"].includes(employmentStatus)) teacher.leavingDate = new Date();
    else teacher.leavingDate = undefined;
    await teacher.save();

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: (req.body.changedByName as string) || "Unknown",
        userRole: req.user.role,
        action: `Changed teacher employment status: ${oldStatus} -> ${employmentStatus}`,
        recordType: "Teacher",
        recordId: teacher._id.toString(),
        oldValue: { employmentStatus: oldStatus },
        newValue: { employmentStatus, reason },
      });
    }

    res.json(teacher);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
