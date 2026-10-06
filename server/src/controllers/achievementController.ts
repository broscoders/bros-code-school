import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Achievement from "../models/Achievement";
import { canAccessStudent, isAssignedToClass } from "../utils/accessControl";
import Student from "../models/Student";

export const addAchievement = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).json({ message: "Title is required" });
    if (!["ACADEMIC", "SPORTS", "COMPETITION", "APPRECIATION", "PARTICIPATION"].includes(req.body.category)) {
      return res.status(400).json({ message: "Please choose a valid category" });
    }
    // The student must be in this school, and a plain teacher can only record
    // achievements for students of the classes assigned to them (any student id
    // used to be accepted, including one from another school).
    const student = await Student.findOne({ _id: req.body.studentId, schoolId });
    if (!student) return res.status(404).json({ message: "Student not found in your school" });
    if (student.classId && !(await isAssignedToClass(req, student.classId.toString()))) {
      return res.status(403).json({ message: "You can only record achievements for students of your assigned classes" });
    }
    const date = req.body.dateAwarded ? new Date(req.body.dateAwarded) : undefined;
    if (date && Number.isNaN(date.getTime())) return res.status(400).json({ message: "Invalid date" });
    const certificateUrl = String(req.body.certificateUrl || "").trim();
    if (certificateUrl && !/^https?:\/\//i.test(certificateUrl)) return res.status(400).json({ message: "Invalid certificate link" });

    const achievement = await Achievement.create({
      schoolId, studentId: student._id, title, category: req.body.category,
      description: String(req.body.description || "").trim() || undefined,
      dateAwarded: date, certificateUrl: certificateUrl || undefined,
    });
    res.status(201).json(achievement);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const list = await Achievement.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
