import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import { canAccessStudent } from "../utils/accessControl";
import Parent from "../models/Parent";
import Teacher from "../models/Teacher";
import Subject from "../models/Subject";
import ClassModel from "../models/ClassModel";
import Section from "../models/Section";
import User from "../models/User";
import Session from "../models/Session";
import { logAudit } from "../utils/auditLogger";
import { syncLinkedAccountStatus, accountStatusForLifecycleStatus } from "../utils/accountSync";
import { actorName } from "../utils/auditActor";

export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { userId, admissionNumber, classId, sectionId, parentId, dateOfBirth, gender, address, admissionDate } = req.body;

    if (!userId || !admissionNumber || !String(admissionNumber).trim() || !classId || !sectionId) {
      return res.status(400).json({ message: "Account, admission number, class and section are required" });
    }

    // the login account must be a STUDENT account of this school and must not
    // already have a student profile
    const account = await User.findOne({ _id: userId, schoolId, role: "STUDENT" });
    if (!account) return res.status(404).json({ message: "Student login account not found" });
    if (await Student.exists({ userId, schoolId })) {
      return res.status(409).json({ message: "This account already has a student profile" });
    }
    if (await Student.exists({ schoolId, admissionNumber: String(admissionNumber).trim() })) {
      return res.status(409).json({ message: `Admission number ${String(admissionNumber).trim()} is already used by another student` });
    }

    // the section must belong to the chosen class (both in this school)
    const section = await Section.findOne({ _id: sectionId, classId, schoolId });
    if (!section) return res.status(404).json({ message: "Section not found in this class" });
    if (section.capacity) {
      const currentCount = await Student.countDocuments({ sectionId, schoolId, status: "ACTIVE" });
      if (currentCount >= section.capacity) {
        return res.status(400).json({ message: `Section "${section.name}" is at full capacity (${section.capacity} students).` });
      }
    }

    // status / classHistory / schoolId are decided here, never by the client
    const student = await Student.create({
      schoolId,
      userId,
      admissionNumber: String(admissionNumber).trim(),
      classId,
      sectionId,
      parentId: parentId || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender,
      address,
      admissionDate: admissionDate || undefined,
      classHistory: [{ classId, sectionId, fromDate: new Date() }],
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

    const qClass = req.query.classId as string | undefined;
    const qSection = req.query.sectionId as string | undefined;
    if (qClass && /^[a-f\d]{24}$/i.test(qClass)) filter.classId = qClass;
    if (qSection && /^[a-f\d]{24}$/i.test(qSection)) filter.sectionId = qSection;

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

    // A plain teacher only ever sees students of the classes assigned to
    // them (before, any teacher could list every student in the school).
    if (role === "TEACHER" || role === "ACADEMY_TEACHER") {
      const me = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      const assigned = (me?.assignedClasses || []).map((c) => c.toString());
      if (qClass) {
        if (!assigned.includes(qClass)) return res.json([]);
      } else {
        filter.classId = { $in: assigned };
      }
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

    const impliedAccountStatus = accountStatusForLifecycleStatus(status);
    if (impliedAccountStatus) {
      await syncLinkedAccountStatus(student.userId, impliedAccountStatus, `Student status: ${status}`);
    }

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: await actorName(req),
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
        userName: await actorName(req),
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

// Blueprint 11 (Account States): direct control for cases the lifecycle
// syncs above don't cover - e.g. suspending a SCHOOL_ADMIN, ACCOUNTANT or
// RECEPTIONIST account, none of which have a Teacher/Student/StaffProfile
// employment-status field to derive this from.
export const updateUserAccountStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = ["ACTIVE", "SUSPENDED", "ARCHIVED"];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

    const target = await User.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target._id.toString() === req.user!.userId) {
      return res.status(400).json({ message: "You cannot change your own account status" });
    }

    // Don't let a school end up with zero people who can log in and
    // manage it - the "returns after being empty" recovery path for that
    // would require a support ticket instead of just picking a different
    // admin to suspend first.
    if (target.role === "SCHOOL_ADMIN" && status !== "ACTIVE") {
      const otherActiveAdmins = await User.countDocuments({
        schoolId: req.user!.schoolId,
        role: "SCHOOL_ADMIN",
        accountStatus: "ACTIVE",
        _id: { $ne: target._id },
      });
      if (otherActiveAdmins === 0) {
        return res.status(400).json({ message: "Cannot deactivate the only remaining School Admin account" });
      }
    }

    const oldStatus = target.accountStatus;
    target.accountStatus = status;
    target.accountStatusReason = reason;
    await target.save();

    // A suspension/archive should end any sessions already open on other
    // devices right away, not just block future logins.
    if (status !== "ACTIVE") {
      await Session.updateMany({ userId: target._id, revoked: false }, { revoked: true, revokedAt: new Date() });
    }

    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: await actorName(req),
      userRole: req.user!.role,
      action: `Changed account status for ${target.email}: ${oldStatus} -> ${status}`,
      recordType: "User",
      recordId: target._id.toString(),
      oldValue: { accountStatus: oldStatus },
      newValue: { accountStatus: status, reason },
    });

    res.json({ id: target._id, email: target.email, accountStatus: target.accountStatus });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createParent = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { userId, relationship } = req.body;
    const children: string[] = Array.isArray(req.body.children) ? req.body.children : [];

    if (!userId) return res.status(400).json({ message: "Parent account is required" });
    const account = await User.findOne({ _id: userId, schoolId, role: "PARENT" });
    if (!account) return res.status(404).json({ message: "Parent login account not found" });

    // Every child must be a real student of THIS school. Before, any student
    // id (even from another school) could be attached, which instantly gave
    // that parent access to the student's fees, results and attendance.
    if (children.length > 0) {
      const found = await Student.countDocuments({ _id: { $in: children }, schoolId });
      if (found !== new Set(children.map(String)).size) {
        return res.status(400).json({ message: "One or more selected students were not found in your school" });
      }
    }

    // A parent account can have several children - merge into the existing
    // profile instead of creating a second one for the same person.
    const existing = await Parent.findOne({ userId, schoolId });
    if (existing) {
      const merged = Array.from(new Set([...existing.children.map((c) => c.toString()), ...children.map(String)]));
      existing.children = merged as any;
      if (relationship) existing.relationship = relationship;
      await existing.save();
      return res.json(existing);
    }

    const parent = await Parent.create({ schoolId, userId, children, relationship });
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
    const email = String(req.query.email || "").trim().toLowerCase();
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
    const schoolId = req.user!.schoolId;
    const { userId, employeeId, qualification, joiningDate } = req.body;
    const subjects: string[] = Array.isArray(req.body.subjects) ? req.body.subjects : [];
    const assignedClasses: string[] = Array.isArray(req.body.assignedClasses) ? req.body.assignedClasses : [];

    if (!userId || !employeeId || !String(employeeId).trim()) {
      return res.status(400).json({ message: "Account and employee ID are required" });
    }
    const account = await User.findOne({ _id: userId, schoolId, role: { $in: ["TEACHER", "ACADEMY_TEACHER"] } });
    if (!account) return res.status(404).json({ message: "Teacher login account not found" });
    if (await Teacher.exists({ userId, schoolId })) return res.status(409).json({ message: "This account already has a teacher profile" });
    if (await Teacher.exists({ schoolId, employeeId: String(employeeId).trim() })) {
      return res.status(409).json({ message: `Employee ID ${String(employeeId).trim()} is already used by another teacher` });
    }

    // classes and subjects must belong to this school
    if (assignedClasses.length && (await ClassModel.countDocuments({ _id: { $in: assignedClasses }, schoolId })) !== new Set(assignedClasses.map(String)).size) {
      return res.status(400).json({ message: "One or more selected classes were not found in your school" });
    }
    if (subjects.length && (await Subject.countDocuments({ _id: { $in: subjects }, schoolId })) !== new Set(subjects.map(String)).size) {
      return res.status(400).json({ message: "One or more selected subjects were not found in your school" });
    }

    // employmentStatus / communicationHours / leavingDate can't be set at creation by the client
    const teacher = await Teacher.create({
      schoolId, userId, employeeId: String(employeeId).trim(), qualification, subjects, assignedClasses, joiningDate: joiningDate || undefined,
    });
    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// The logged-in teacher's own record. The teacher portal used to download
// every teacher in the school and search for itself in the browser.
export const getMyTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId }).populate("userId subjects assignedClasses");
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found" });
    res.json(teacher);
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

    const impliedAccountStatus = accountStatusForLifecycleStatus(employmentStatus);
    if (impliedAccountStatus) {
      await syncLinkedAccountStatus(teacher.userId, impliedAccountStatus, `Employment status: ${employmentStatus}`);
    }

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: await actorName(req),
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
