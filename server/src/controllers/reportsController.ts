import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Student from "../models/Student";
import Result from "../models/Result";
import Attendance from "../models/Attendance";
import School from "../models/School";
import Admission from "../models/Admission";
import Teacher from "../models/Teacher";
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

    // Class performance: average result % per class. Blueprint's Reports
    // section explicitly calls for "class performance, subject performance,
    // grade distribution" - a headcount table alone doesn't show any of that.
    const results = await Result.find({ studentId: { $in: studentIds }, isPublished: true })
      .populate({ path: "examId", populate: { path: "subjectId" } })
      .populate({ path: "studentId", populate: { path: "classId" } });
    const classPerf: Record<string, { total: number; count: number }> = {};
    const subjectPerf: Record<string, { total: number; count: number }> = {};
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    for (const r of results as any[]) {
      const totalMarks = r.examId?.totalMarks;
      if (!totalMarks) continue;
      const pct = (r.marksObtained / totalMarks) * 100;
      const className = r.studentId?.classId?.name || "Unassigned";
      if (!classPerf[className]) classPerf[className] = { total: 0, count: 0 };
      classPerf[className].total += pct;
      classPerf[className].count += 1;

      const subjectName = r.examId?.subjectId?.name || "Unknown";
      if (!subjectPerf[subjectName]) subjectPerf[subjectName] = { total: 0, count: 0 };
      subjectPerf[subjectName].total += pct;
      subjectPerf[subjectName].count += 1;

      if (pct >= 80) gradeDistribution.A++;
      else if (pct >= 65) gradeDistribution.B++;
      else if (pct >= 50) gradeDistribution.C++;
      else if (pct >= 40) gradeDistribution.D++;
      else gradeDistribution.F++;
    }
    const classPerformance = Object.entries(classPerf).map(([name, v]) => ({ name, averagePercent: Math.round(v.total / v.count) }));
    const subjectPerformance = Object.entries(subjectPerf).map(([name, v]) => ({ name, averagePercent: Math.round(v.total / v.count) }));

    // Admissions funnel: counts by status, so the CRM/admissions pipeline
    // has an at-a-glance conversion view instead of only a raw list.
    const admissionStatuses = ["APPLICATION", "REVIEW", "INTERVIEW", "APPROVED", "REJECTED", "CONVERTED"] as const;
    const admissionCounts = await Promise.all(admissionStatuses.map((s) => Admission.countDocuments({ schoolId, status: s })));
    const admissionFunnel = admissionStatuses.map((status, i) => ({ status, count: admissionCounts[i] }));

    // Staff attendance: teachers currently on leave / active, as a coarse
    // staff-side stat until dedicated staff-attendance tracking exists.
    const teacherStatusCounts: Record<string, number> = {};
    const teachers = await Teacher.find({ schoolId });
    for (const t of teachers) {
      teacherStatusCounts[t.employmentStatus] = (teacherStatusCounts[t.employmentStatus] || 0) + 1;
    }

    res.json({
      totalStudents: students.length,
      classCounts,
      totalResultsRecorded,
      classPerformance,
      subjectPerformance,
      gradeDistribution,
      admissionFunnel,
      teacherStatusCounts,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
