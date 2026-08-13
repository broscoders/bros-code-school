import type { Request, Response } from "express";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Lead from "../models/Lead";
import LibraryBook from "../models/LibraryBook";
import Invoice from "../models/Invoice";

export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q, schoolId } = req.query;
    if (!q || !schoolId) return res.json({ students: [], teachers: [], leads: [], books: [] });

    const regex = new RegExp(String(q), "i");

    const [students, teachers, leads, books] = await Promise.all([
      Student.find({ schoolId, admissionNumber: regex }).populate("userId classId").limit(5),
      Teacher.find({ schoolId, employeeId: regex }).populate("userId").limit(5),
      Lead.find({ schoolId, name: regex }).limit(5),
      LibraryBook.find({ schoolId, title: regex }).limit(5),
    ]);

    const studentsByName = await Student.find({ schoolId }).populate({ path: "userId", match: { name: regex } }).limit(20);
    const filteredStudents = studentsByName.filter((s: any) => s.userId).slice(0, 5);

    const teachersByName = await Teacher.find({ schoolId }).populate({ path: "userId", match: { name: regex } }).limit(20);
    const filteredTeachers = teachersByName.filter((t: any) => t.userId).slice(0, 5);

    res.json({
      students: [...students, ...filteredStudents].slice(0, 5),
      teachers: [...teachers, ...filteredTeachers].slice(0, 5),
      leads,
      books,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
