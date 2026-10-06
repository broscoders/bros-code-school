import type { Response } from "express";
import mongoose from "mongoose";
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
    // Parents and students only ever see PUBLISHED marks (GET /ops/results
    // already did this). The report card did not, so marks still being
    // corrected - or not yet released - were visible, and the pass/fail
    // status was computed from them.
    const resultFilter: Record<string, any> = { studentId: student._id };
    if (["PARENT", "STUDENT"].includes(req.user!.role)) resultFilter.isPublished = true;
    const results = await Result.find(resultFilter).populate("examId");
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
    const oid = new mongoose.Types.ObjectId(schoolId);

    // Every figure below is computed by the database. This used to load EVERY
    // student and EVERY published result (with two levels of populate) into
    // memory and add them up in Node, which got slower with every exam and
    // was the main reason the Reports page took so long to open.
    const [classCountRows, totalStudents, totalResultsRecorded, perfRows, admissionRows, teacherRows] = await Promise.all([
      Student.aggregate([
        { $match: { schoolId: oid } },
        { $group: { _id: "$classId", n: { $sum: 1 } } },
        { $lookup: { from: "classmodels", localField: "_id", foreignField: "_id", as: "cls" } },
        { $project: { n: 1, name: { $ifNull: [{ $arrayElemAt: ["$cls.name", 0] }, "Unassigned"] } } },
      ]),
      Student.countDocuments({ schoolId }),
      // Result has no schoolId of its own, so it is counted through this school's students
      Result.aggregate([
        { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "stu" } },
        { $match: { "stu.schoolId": oid } },
        { $count: "n" },
      ]).then((rows: any[]) => rows[0]?.n || 0),
      Result.aggregate([
        { $match: { isPublished: true } },
        { $lookup: { from: "students", localField: "studentId", foreignField: "_id", as: "stu" } },
        { $unwind: "$stu" },
        { $match: { "stu.schoolId": oid } },
        { $lookup: { from: "exams", localField: "examId", foreignField: "_id", as: "exam" } },
        { $unwind: "$exam" },
        { $match: { "exam.totalMarks": { $gt: 0 } } },
        { $addFields: { pct: { $multiply: [{ $divide: ["$marksObtained", "$exam.totalMarks"] }, 100] } } },
        {
          $facet: {
            byClass: [
              { $group: { _id: "$stu.classId", avg: { $avg: "$pct" } } },
              { $lookup: { from: "classmodels", localField: "_id", foreignField: "_id", as: "cls" } },
              { $project: { avg: 1, name: { $ifNull: [{ $arrayElemAt: ["$cls.name", 0] }, "Unassigned"] } } },
            ],
            bySubject: [
              { $group: { _id: "$exam.subjectId", avg: { $avg: "$pct" } } },
              { $lookup: { from: "subjects", localField: "_id", foreignField: "_id", as: "sub" } },
              { $project: { avg: 1, name: { $ifNull: [{ $arrayElemAt: ["$sub.name", 0] }, "Unknown"] } } },
            ],
            grades: [
              {
                $group: {
                  _id: {
                    $switch: {
                      branches: [
                        { case: { $gte: ["$pct", 80] }, then: "A" },
                        { case: { $gte: ["$pct", 65] }, then: "B" },
                        { case: { $gte: ["$pct", 50] }, then: "C" },
                        { case: { $gte: ["$pct", 40] }, then: "D" },
                      ],
                      default: "F",
                    },
                  },
                  n: { $sum: 1 },
                },
              },
            ],
          },
        },
      ]),
      Admission.aggregate([{ $match: { schoolId: oid } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
      Teacher.aggregate([{ $match: { schoolId: oid } }, { $group: { _id: "$employmentStatus", n: { $sum: 1 } } }]),
    ]);

    const classCounts: Record<string, number> = {};
    classCountRows.forEach((r: any) => (classCounts[r.name] = (classCounts[r.name] || 0) + r.n));

    const facet = perfRows[0] || { byClass: [], bySubject: [], grades: [] };
    const merge = (rows: any[]) => {
      const m: Record<string, { t: number; c: number }> = {};
      rows.forEach((r) => { m[r.name] = m[r.name] || { t: 0, c: 0 }; m[r.name].t += r.avg; m[r.name].c += 1; });
      return Object.entries(m).map(([name, v]) => ({ name, averagePercent: Math.round(v.t / v.c) }));
    };
    const classPerformance = merge(facet.byClass);
    const subjectPerformance = merge(facet.bySubject);
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    facet.grades.forEach((g: any) => (gradeDistribution[g._id] = g.n));

    const stageCount: Record<string, number> = {};
    admissionRows.forEach((r: any) => (stageCount[r._id] = r.n));
    const admissionStatuses = ["APPLICATION", "REVIEW", "INTERVIEW", "APPROVED", "REJECTED", "CONVERTED"] as const;
    const admissionFunnel = admissionStatuses.map((status) => ({ status, count: stageCount[status] || 0 }));

    const teacherStatusCounts: Record<string, number> = {};
    teacherRows.forEach((r: any) => (teacherStatusCounts[r._id] = r.n));

    res.json({
      totalStudents,
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
