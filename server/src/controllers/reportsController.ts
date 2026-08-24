import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import Result from "../models/Result";
import Attendance from "../models/Attendance";
import School from "../models/School";
import { canAccessStudent } from "../utils/accessControl";

export const getReportCardData = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, String(req.params.studentId));
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const student = await Student.findOne({ _id: req.params.studentId, schoolId: req.user!.schoolId }).populate("userId classId sectionId");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const school = await School.findById(student.schoolId);
    const results = await Result.find({ studentId: student._id }).populate("examId");
    const attendanceRecords = await Attendance.find({ studentId: student._id });

    const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
    const attendancePercent = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

    const gradedResults = results.filter((r) => (r.examId as any)?.totalMarks);
    const totalPossible = gradedResults.reduce((sum, r) => sum + ((r.examId as any)?.totalMarks || 0), 0);
    const totalObtained = gradedResults.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
    const overallPercent = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 10000) / 100 : 0;
    const passingThreshold = 40;
    const failedSubjects = gradedResults.filter((r) => {
      const pct = ((r.marksObtained || 0) / ((r.examId as any)?.totalMarks || 1)) * 100;
      return pct < passingThreshold;
    });
    const overallStatus = gradedResults.length > 0 && failedSubjects.length === 0 ? "PASS" : gradedResults.length > 0 ? "FAIL" : "PENDING";

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
      summary: {
        totalPossible,
        totalObtained,
        overallPercent,
        overallStatus,
        failedSubjectCount: failedSubjects.length,
      },
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
    const studentIds = students.map((s) => s._id);
    const totalResultsRecorded = await Result.countDocuments({ studentId: { $in: studentIds } });

    const classCounts: Record<string, number> = {};
    students.forEach((s: any) => {
      const className = s.classId?.name || "Unassigned";
      classCounts[className] = (classCounts[className] || 0) + 1;
    });

    res.json({
      totalStudents: students.length,
      classCounts,
      totalResultsRecorded,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
