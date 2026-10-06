import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Lead from "../models/Lead";
import LibraryBook from "../models/LibraryBook";
import User from "../models/User";

const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const globalSearch = async (req: AuthRequest, res: Response) => {
  try {
    const raw = String(req.query.q || "").trim().slice(0, 60);
    const schoolId = req.user!.schoolId;
    const role = req.user!.role;
    const empty = { students: [], teachers: [], leads: [], books: [] };
    if (raw.length < 2) return res.json(empty);

    // The text is escaped before it becomes a regular expression. It used to
    // be used as-is, so typing "(" or "[" crashed the search with a 500, and a
    // crafted pattern could make the database spin.
    const regex = new RegExp(escapeRegex(raw), "i");

    const books = await LibraryBook.find({ schoolId, title: regex }).limit(5);

    // Students and parents may look up library books only. They could search
    // every student, teacher and CRM lead (parent phone numbers) in the school.
    if (role === "STUDENT" || role === "PARENT") return res.json({ ...empty, books });

    const isTeacher = role === "TEACHER" || role === "ACADEMY_TEACHER";
    const studentFilter: Record<string, any> = { schoolId };
    if (isTeacher) {
      // a teacher searches only the students of the classes assigned to them
      const me = await Teacher.findOne({ userId: req.user!.userId, schoolId }).select("assignedClasses");
      studentFilter.classId = { $in: me?.assignedClasses || [] };
    }

    // Name search used to load the first 20 students of the school and
    // filter those by name, so anyone beyond the 20th could never be found.
    // Now the name is matched in the database first.
    const [nameUsers, teacherNameUsers] = await Promise.all([
      User.find({ schoolId, role: "STUDENT", name: regex }).select("_id").limit(25),
      isTeacher ? Promise.resolve([]) : User.find({ schoolId, role: { $in: ["TEACHER", "ACADEMY_TEACHER"] }, name: regex }).select("_id").limit(25),
    ]);

    const [studentsByNumber, studentsByName, teachersByNumber, teachersByName, leads] = await Promise.all([
      Student.find({ ...studentFilter, admissionNumber: regex }).populate("userId classId").limit(5),
      Student.find({ ...studentFilter, userId: { $in: nameUsers.map((u) => u._id) } }).populate("userId classId").limit(5),
      isTeacher ? Promise.resolve([]) : Teacher.find({ schoolId, employeeId: regex }).populate("userId").limit(5),
      isTeacher ? Promise.resolve([]) : Teacher.find({ schoolId, userId: { $in: teacherNameUsers.map((u) => u._id) } }).populate("userId").limit(5),
      // CRM leads are admissions-staff material
      isTeacher ? Promise.resolve([]) : Lead.find({ schoolId, name: regex }).limit(5),
    ]);

    const unique = <T extends { _id: any }>(list: T[]) => {
      const seen = new Set<string>();
      return list.filter((x) => (seen.has(x._id.toString()) ? false : (seen.add(x._id.toString()), true))).slice(0, 5);
    };

    res.json({
      students: unique([...studentsByNumber, ...studentsByName]),
      teachers: unique([...teachersByNumber, ...teachersByName]),
      leads,
      books,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
