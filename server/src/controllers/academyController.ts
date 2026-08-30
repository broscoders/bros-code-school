import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent } from "../utils/accessControl";
import AcademyProgram from "../models/AcademyProgram";
import AcademyBatch from "../models/AcademyBatch";
import AcademyEnrollment from "../models/AcademyEnrollment";
import Teacher from "../models/Teacher";

export const createAcademyProgram = async (req: AuthRequest, res: Response) => {
  try {
    const item = await AcademyProgram.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyPrograms = async (req: AuthRequest, res: Response) => {
  try {
    const list = await AcademyProgram.find({ schoolId: req.user!.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createAcademyBatch = async (req: AuthRequest, res: Response) => {
  try {
    const program = await AcademyProgram.findOne({ _id: req.body.programId, schoolId: req.user!.schoolId });
    if (!program) return res.status(404).json({ message: "Program not found" });
    const item = await AcademyBatch.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyBatches = async (req: AuthRequest, res: Response) => {
  try {
    const list = await AcademyBatch.find({ schoolId: req.user!.schoolId, programId: req.query.programId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyAcademyBatches = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.query.teacherId as string;
    const role = req.user!.role;
    if (role === "TEACHER" || role === "ACADEMY_TEACHER") {
      const myTeacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myTeacher || myTeacher._id.toString() !== teacherId) {
        return res.status(403).json({ message: "You can only view your own batches" });
      }
    }
    const list = await AcademyBatch.find({ schoolId: req.user!.schoolId, teacherId }).populate("programId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getBatchStudents = async (req: AuthRequest, res: Response) => {
  try {
    const batch = await AcademyBatch.findOne({ _id: req.params.batchId, schoolId: req.user!.schoolId });
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    // Only meant for the instructor managing their own roster, or admin
    // staff - without this, any parent/student could list every student
    // enrolled in any academy batch just by knowing its id.
    const role = req.user!.role;
    const STAFF_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR"];
    if (role === "TEACHER" || role === "ACADEMY_TEACHER") {
      const myTeacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myTeacher || myTeacher._id.toString() !== batch.teacherId?.toString()) {
        return res.status(403).json({ message: "You can only view your own batch's students" });
      }
    } else if (!STAFF_ROLES.includes(role)) {
      return res.status(403).json({ message: "You are not authorized to view this batch's roster" });
    }

    const enrollments = await AcademyEnrollment.find({ batchId: req.params.batchId, isActive: true }).populate({ path: "studentId", populate: { path: "userId" } });
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const enrollInAcademy = async (req: AuthRequest, res: Response) => {
  try {
    const batch = await AcademyBatch.findOne({ _id: req.body.batchId, schoolId: req.user!.schoolId });
    if (!batch) return res.status(404).json({ message: "Batch not found in your school" });

    // This route is reachable directly by PARENT/STUDENT for self-enrollment
    // - without this check, a parent could enroll (and create a fee
    // obligation for) a student who isn't their own child.
    const allowed = await canAccessStudent(req, req.body.studentId);
    if (!allowed) return res.status(403).json({ message: "You do not have access to enroll this student" });

    const item = await AcademyEnrollment.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAcademyEnrollments = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.query.studentId as string | undefined;
    if (studentId) {
      const allowed = await canAccessStudent(req, studentId);
      if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });
    }
    const list = await AcademyEnrollment.find({ schoolId: req.user!.schoolId, ...(studentId ? { studentId } : {}) }).populate("batchId");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
