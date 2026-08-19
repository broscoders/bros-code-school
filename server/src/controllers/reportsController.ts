import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import Result from "../models/Result";
import Attendance from "../models/Attendance";
import School from "../models/School";

export const getReportCardData = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ _id: req.params.studentId, schoolId: req.user!.schoolId }).populate("userId classId sectionId");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const school = await School.findById(student.schoolId);
    const results = await Result.find({ studentId: student._id }).populate("examId");
    const attendanceRecords = await Attendance.find({ studentId: student._id });

    const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const attendancePercent = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

    res.json({
      school: { name: school?.name, logoUrl: school?.logoUrl },
      student: {
        name: (student.userId as any)?.name,
        admissionNumber: student.admissionNumber,
        class: (student.classId as any)?.name,
        section: (student.sectionId as any)?.name,
      },
      results: results.map((r) => ({
        exam: (r.examId as any)?.name,
        totalMarks: (r.examId as any)?.totalMarks,
        marksObtained: r.marksObtained,
        grade: r.grade,
      })),
      attendancePercent,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getReportsSummary = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const students = await Student.find({ schoolId }).populate("classId");
    const results = await Result.find().populate({ path: "studentId", match: { schoolId } });

    const classCounts: Record<string, number> = {};
    students.forEach((s: any) => {
      const className = s.classId?.name || "Unassigned";
      classCounts[className] = (classCounts[className] || 0) + 1;
    });

    res.json({
      totalStudents: students.length,
      classCounts,
      totalResultsRecorded: results.filter((r: any) => r.studentId).length,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
