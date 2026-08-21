import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import { canAccessStudent } from "../utils/accessControl";
import Parent from "../models/Parent";
import Teacher from "../models/Teacher";
import Section from "../models/Section";
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

    const students = await Student.find(filter).populate("userId classId sectionId");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.params.id);
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
    const validStatuses = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TRANSFERRED", "WITHDRAWN", "GRADUATED", "ALUMNI"];
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
    const parent = await Parent.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(parent);
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
