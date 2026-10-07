import type { Response } from "express";
import Attendance from "../models/Attendance";
import Homework from "../models/Homework";
import HomeworkSubmission from "../models/HomeworkSubmission";
import Assignment from "../models/Assignment";
import AssignmentSubmission from "../models/AssignmentSubmission";
import Exam from "../models/Exam";
import Result from "../models/Result";
import FeeStructure from "../models/FeeStructure";
import Invoice from "../models/Invoice";
import Student from "../models/Student";
import Section from "../models/Section";
import ClassModel from "../models/ClassModel";
import Subject from "../models/Subject";
import Parent from "../models/Parent";
import Teacher from "../models/Teacher";
import Discount from "../models/Discount";
import User from "../models/User";
import { canAccessStudent, isOwnClass, isAssignedToClass } from "../utils/accessControl";
import { logAudit } from "../utils/auditLogger";
import { notify, notifyMany } from "../utils/notifier";
import type { AuthRequest } from "../middleware/authMiddleware";
import { actorName } from "../utils/auditActor";

export const markAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const belongsToSchool = await Student.findOne({ _id: req.body.studentId, schoolId: req.user!.schoolId });
    if (!belongsToSchool) return res.status(404).json({ message: "Student not found in your school" });

    // Blueprint 27 (Teacher Workload): a plain TEACHER account could
    // otherwise mark attendance for any student in the school, not just
    // the classes they're actually assigned to teach.
    if (belongsToSchool.classId && !(await isAssignedToClass(req, belongsToSchool.classId.toString()))) {
      return res.status(403).json({ message: "You are not assigned to this student's class" });
    }

    // Upsert on (studentId, date) rather than always creating a new row -
    // without this, a teacher re-submitting the same day's attendance (e.g.
    // to correct one student's status) created a duplicate record for
    // every student in the class, corrupting attendance percentages and
    // reports. Blueprint also calls for corrections to be audit-logged.
    const existing = await Attendance.findOne({ studentId: req.body.studentId, date: new Date(req.body.date), schoolId: req.user!.schoolId });
    const record = await Attendance.findOneAndUpdate(
      { studentId: req.body.studentId, date: new Date(req.body.date), schoolId: req.user!.schoolId },
      {
        studentId: belongsToSchool._id,
        date: new Date(req.body.date),
        status: req.body.status,
        remarks: req.body.remarks,
        schoolId: req.user!.schoolId,
        // Who marked it and which class it belongs to come from the login and
        // the student record - never from the request body, so a teacher
        // cannot record attendance under someone else's name.
        markedBy: req.user!.userId,
        classId: belongsToSchool.classId,
        sectionId: belongsToSchool.sectionId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (existing && existing.status !== record.status) {
      const actingUser = await User.findById(req.user!.userId).select("name");
      await logAudit({
        schoolId: req.user!.schoolId,
        userId: req.user!.userId,
        userName: actingUser?.name || "Unknown",
        userRole: req.user!.role,
        action: "Corrected attendance",
        recordType: "Attendance",
        recordId: record._id.toString(),
        oldValue: { status: existing.status },
        newValue: { status: record.status },
      });
    }

    if (req.body.status === "ABSENT" || req.body.status === "LATE") {
      const student = await Student.findById(req.body.studentId).populate("userId");
      const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId: req.user!.schoolId,
          userId: (parent.userId as any)._id.toString(),
          title: req.body.status === "ABSENT" ? "Child marked absent" : "Child marked late",
          message: `${(student?.userId as any)?.name || "Your child"} was marked ${req.body.status.toLowerCase()} today.`,
          category: "ATTENDANCE",
        });
      }
    }

    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const bulkMarkAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, sectionId, date, records } = req.body;
    const schoolId = req.user!.schoolId;
    const VALID_STATUSES = ["PRESENT", "ABSENT", "LATE", "LEAVE"];

    if (!classId || !sectionId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: "classId, sectionId, date and at least one record are required" });
    }
    const attDate = new Date(date);
    if (Number.isNaN(attDate.getTime())) return res.status(400).json({ message: "Invalid date" });
    if (attDate.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: "Attendance cannot be marked for a future date" });
    }
    if (records.some((r: any) => !r || !VALID_STATUSES.includes(r.status))) {
      return res.status(400).json({ message: "Each record needs a valid status (PRESENT, ABSENT, LATE or LEAVE)" });
    }

    // The section must exist in this school AND belong to the class sent.
    const section = await Section.findOne({ _id: sectionId, classId, schoolId });
    if (!section) return res.status(404).json({ message: "Section not found in this class" });

    if (!(await isAssignedToClass(req, classId))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }

    // Only students who really belong to this class + section can be marked.
    // Before, a teacher assigned to class A could send class A's id with
    // students from class B and mark them.
    const studentIds = records.map((r: any) => r.studentId);
    const validStudents = await Student.find({ _id: { $in: studentIds }, schoolId, classId, sectionId }).select("_id");
    const validIds = new Set(validStudents.map((s) => s._id.toString()));
    const validRecords = records.filter((r: any) => validIds.has(String(r.studentId)));
    if (validRecords.length === 0) return res.status(400).json({ message: "No valid students to mark" });

    const previous = await Attendance.find({ schoolId, date: attDate, studentId: { $in: [...validIds] } }).select("studentId status");
    const prevStatus = new Map(previous.map((p) => [p.studentId.toString(), p.status]));

    const ops: any[] = validRecords.map((r: any) => ({
      updateOne: {
        filter: { studentId: r.studentId, date: attDate },
        update: { $set: { status: r.status, schoolId, classId, sectionId, markedBy: req.user!.userId } },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);

    // Notify parents only when the status actually changed to ABSENT/LATE
    // (re-saving the same sheet no longer sends the same alert again), and
    // only say "today" when the date really is today.
    const isToday = attDate.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
    const toNotify = validRecords.filter(
      (r: any) => (r.status === "ABSENT" || r.status === "LATE") && prevStatus.get(String(r.studentId)) !== r.status
    );
    if (toNotify.length > 0) {
      const ids = toNotify.map((r: any) => r.studentId);
      const [studs, parents] = await Promise.all([
        Student.find({ _id: { $in: ids } }).populate("userId", "name"),
        Parent.find({ schoolId, children: { $in: ids } }).select("userId children"),
      ]);
      const nameOf = new Map(studs.map((st) => [st._id.toString(), (st.userId as any)?.name || "Your child"]));
      const parentOf = new Map<string, string>();
      parents.forEach((pa) => pa.children.forEach((c) => { if (!parentOf.has(c.toString())) parentOf.set(c.toString(), pa.userId.toString()); }));
      await notifyMany(
        toNotify
          .filter((r: any) => parentOf.has(String(r.studentId)))
          .map((r: any) => ({
            schoolId,
            userId: parentOf.get(String(r.studentId))!,
            title: r.status === "ABSENT" ? "Child marked absent" : "Child marked late",
            message: `${nameOf.get(String(r.studentId))} was marked ${r.status.toLowerCase()} ${isToday ? "today" : "on " + attDate.toISOString().slice(0, 10)}.`,
            category: "ATTENDANCE" as const,
          }))
      );
    }

    res.json({ marked: ops.length, skipped: records.length - validRecords.length, parentsNotified: toNotify.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Returns one section's attendance for one date, so the teacher screen can
// show what was already saved instead of defaulting everyone to PRESENT.
export const getSectionAttendanceForDate = async (req: AuthRequest, res: Response) => {
  try {
    const { classId, sectionId, date } = req.query as Record<string, string>;
    if (!classId || !sectionId || !date) return res.status(400).json({ message: "classId, sectionId and date are required" });
    if (!(await isAssignedToClass(req, classId))) return res.status(403).json({ message: "You are not assigned to this class" });
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid date" });
    const records = await Attendance.find({ schoolId: req.user!.schoolId, classId, sectionId, date: d }).select("studentId status");
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const records = await Attendance.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint 34/70: "an attendance Excel sheet should exist so the whole
// month's attendance is visible at month-end." Every existing attendance
// endpoint is scoped to one student - this one instead returns a whole
// section's attendance for a given month in one call, in a shape the
// client can pivot straight into a register (rows=students,
// columns=days) without N+1 API calls per student.
export const getAttendanceRegister = async (req: AuthRequest, res: Response) => {
  try {
    const { sectionId, month, year } = req.query as { sectionId: string; month: string; year: string };
    if (!sectionId || !month || !year) {
      return res.status(400).json({ message: "sectionId, month and year are required" });
    }

    const monthNum = Number(month);
    const yearNum = Number(year);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12 || !Number.isInteger(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ message: "month must be 1-12 and year must be a valid year" });
    }
    const sectionDoc = await Section.findOne({ _id: sectionId, schoolId: req.user!.schoolId });
    if (!sectionDoc) return res.status(404).json({ message: "Section not found" });
    if (!(await isAssignedToClass(req, sectionDoc.classId.toString()))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 1));

    const students = await Student.find({ schoolId: req.user!.schoolId, sectionId, status: { $ne: "ARCHIVED" } })
      .populate("userId", "name")
      .sort({ admissionNumber: 1 });

    const records = await Attendance.find({
      schoolId: req.user!.schoolId,
      sectionId,
      date: { $gte: startDate, $lt: endDate },
    });

    res.json({
      students: students.map((s) => ({ id: s._id, admissionNumber: s.admissionNumber, name: (s.userId as any)?.name })),
      records: records.map((r) => ({ studentId: r.studentId, date: r.date, status: r.status })),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createHomework = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, sectionId, subjectId } = req.body;
    if (!classId || !sectionId || !subjectId || !req.body.title || !req.body.dueDate) {
      return res.status(400).json({ message: "Class, section, subject, title and due date are required" });
    }
    if (Number.isNaN(new Date(req.body.dueDate).getTime())) return res.status(400).json({ message: "Invalid due date" });
    if (!(await isAssignedToClass(req, classId))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }
    // class/section/subject must all exist in this school and match each other
    const section = await Section.findOne({ _id: sectionId, classId, schoolId });
    if (!section) return res.status(404).json({ message: "Section not found in this class" });
    // teacherId comes from the login, never from the request body
    const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId });
    if (!teacher) return res.status(403).json({ message: "Only users with a teacher profile can create this" });
    const subject = await Subject.findOne({ _id: subjectId, classId, schoolId });
    if (!subject) return res.status(404).json({ message: "Subject not found in this class" });
    const doc = await Homework.create({
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      schoolId,
      classId,
      sectionId,
      subjectId,
      teacherId: teacher._id,
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getHomework = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.query.classId as string;
    // Homework for a class is only relevant/appropriate to see for staff or
    // people actually in that class - without this, any parent/student
    // could browse another class's homework by passing a different classId.
    if (["STUDENT", "PARENT"].includes(req.user!.role)) {
      const allowed = await isOwnClass(req, classId);
      if (!allowed) return res.status(403).json({ message: "You do not have access to this class" });
    }
    const list = await Homework.find({ schoolId: req.user!.schoolId, classId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitHomework = async (req: AuthRequest, res: Response) => {
  try {
    const homework = await Homework.findOne({ _id: req.body.homeworkId, schoolId: req.user!.schoolId });
    if (!homework) return res.status(404).json({ message: "Homework not found in your school" });

    let studentId = req.body.studentId;
    if (req.user!.role === "STUDENT") {
      const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myStudent) return res.status(403).json({ message: "Student profile not found" });
      // a student can only hand in work set for their own class
      if (!myStudent.classId || myStudent.classId.toString() !== homework.classId.toString()) {
        return res.status(403).json({ message: "This homework is not for your class" });
      }
      studentId = myStudent._id.toString();
    } else {
      const belongs = await Student.findOne({ _id: studentId, schoolId: req.user!.schoolId });
      if (!belongs) return res.status(404).json({ message: "Student not found in your school" });
    }

    const submissionUrl = String(req.body.submissionUrl || "").trim();
    if (!submissionUrl || !/^https?:\/\//i.test(submissionUrl)) {
      return res.status(400).json({ message: "Please attach your work before submitting" });
    }

    // Marked work can't be overwritten by resubmitting
    const existing = await HomeworkSubmission.findOne({ homeworkId: req.body.homeworkId, studentId });
    if (existing && ["COMPLETED"].includes(existing.status)) {
      return res.status(400).json({ message: "This has already been marked and can no longer be changed" });
    }

    // ONLY the file link is taken from the student. The whole request body used
    // to be saved, so a student could send marksObtained / feedback with their
    // submission and grade their own work.
    const submission = await HomeworkSubmission.findOneAndUpdate(
      { homeworkId: req.body.homeworkId, studentId },
      { $set: { submissionUrl, status: "SUBMITTED", submittedAt: new Date() }, $setOnInsert: { homeworkId: req.body.homeworkId, studentId } },
      { upsert: true, new: true }
    );
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, sectionId, subjectId } = req.body;
    if (!classId || !sectionId || !subjectId || !req.body.title || !req.body.dueDate) {
      return res.status(400).json({ message: "Class, section, subject, title and due date are required" });
    }
    if (Number.isNaN(new Date(req.body.dueDate).getTime())) return res.status(400).json({ message: "Invalid due date" });
    if (!(await isAssignedToClass(req, classId))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }
    // class/section/subject must all exist in this school and match each other
    const section = await Section.findOne({ _id: sectionId, classId, schoolId });
    if (!section) return res.status(404).json({ message: "Section not found in this class" });
    // teacherId comes from the login, never from the request body
    const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId });
    if (!teacher) return res.status(403).json({ message: "Only users with a teacher profile can create this" });
    const subject = await Subject.findOne({ _id: subjectId, classId, schoolId });
    if (!subject) return res.status(404).json({ message: "Subject not found in this class" });
    const doc = await Assignment.create({
      title: req.body.title,
      instructions: req.body.instructions,
      totalMarks: req.body.totalMarks === "" || req.body.totalMarks == null ? undefined : Number(req.body.totalMarks),
      dueDate: req.body.dueDate,
      schoolId,
      classId,
      sectionId,
      subjectId,
      teacherId: teacher._id,
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.query.classId as string;
    if (!classId) return res.status(400).json({ message: "classId is required" });
    if (["STUDENT", "PARENT"].includes(req.user!.role)) {
      const allowed = await isOwnClass(req, classId);
      if (!allowed) return res.status(403).json({ message: "You do not have access to this class" });
    }
    const list = await Assignment.find({ schoolId: req.user!.schoolId, classId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.body.assignmentId, schoolId: req.user!.schoolId });
    if (!assignment) return res.status(404).json({ message: "Assignment not found in your school" });

    let studentId = req.body.studentId;
    if (req.user!.role === "STUDENT") {
      const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
      if (!myStudent) return res.status(403).json({ message: "Student profile not found" });
      // a student can only hand in work set for their own class
      if (!myStudent.classId || myStudent.classId.toString() !== assignment.classId.toString()) {
        return res.status(403).json({ message: "This assignment is not for your class" });
      }
      studentId = myStudent._id.toString();
    } else {
      const belongs = await Student.findOne({ _id: studentId, schoolId: req.user!.schoolId });
      if (!belongs) return res.status(404).json({ message: "Student not found in your school" });
    }

    const submissionUrl = String(req.body.submissionUrl || "").trim();
    if (!submissionUrl || !/^https?:\/\//i.test(submissionUrl)) {
      return res.status(400).json({ message: "Please attach your work before submitting" });
    }

    // Marked work can't be overwritten by resubmitting
    const existing = await AssignmentSubmission.findOne({ assignmentId: req.body.assignmentId, studentId });
    if (existing && ["GRADED"].includes(existing.status)) {
      return res.status(400).json({ message: "This has already been marked and can no longer be changed" });
    }

    // ONLY the file link is taken from the student. The whole request body used
    // to be saved, so a student could send marksObtained / feedback with their
    // submission and grade their own work.
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignmentId: req.body.assignmentId, studentId },
      { $set: { submissionUrl, status: "SUBMITTED", submittedAt: new Date() }, $setOnInsert: { assignmentId: req.body.assignmentId, studentId } },
      { upsert: true, new: true }
    );
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, sectionId, subjectId, examType, date } = req.body;
    const name = String(req.body.name || "").trim();
    const totalMarks = Number(req.body.totalMarks);
    if (!classId || !sectionId || !subjectId || !name || !examType || !date) {
      return res.status(400).json({ message: "Class, section, subject, exam name, type and date are required" });
    }
    if (!["QUIZ", "TEST", "MIDTERM", "FINAL", "PRACTICAL", "ASSIGNMENT"].includes(examType)) {
      return res.status(400).json({ message: "Invalid exam type" });
    }
    if (Number.isNaN(new Date(date).getTime())) return res.status(400).json({ message: "Invalid exam date" });
    if (!Number.isFinite(totalMarks) || totalMarks <= 0 || totalMarks > 10000) {
      return res.status(400).json({ message: "Total marks must be a number greater than zero" });
    }
    if (!(await Section.exists({ _id: sectionId, classId, schoolId }))) return res.status(404).json({ message: "Section not found in this class" });
    if (!(await Subject.exists({ _id: subjectId, classId, schoolId }))) return res.status(404).json({ message: "Subject not found in this class" });

    const exam = await Exam.create({ schoolId, classId, sectionId, subjectId, name, examType, date, totalMarks });
    res.status(201).json(exam);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.query.classId as string;
    if (["STUDENT", "PARENT"].includes(req.user!.role)) {
      const allowed = await isOwnClass(req, classId);
      if (!allowed) return res.status(403).json({ message: "You do not have access to this class" });
    }
    const list = await Exam.find({ schoolId: req.user!.schoolId, classId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const enterResult = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.findOne({ _id: req.body.examId, schoolId: req.user!.schoolId });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Blueprint 27/41 (Teacher Workload / Marks Entry): a plain TEACHER
    // could otherwise enter (or overwrite) marks for any exam in the
    // school, including classes they don't teach.
    if (!(await isAssignedToClass(req, exam.classId.toString()))) {
      return res.status(403).json({ message: "You are not assigned to this exam's class" });
    }

    const belongsToSchool = await Student.findOne({ _id: req.body.studentId, schoolId: req.user!.schoolId });
    if (!belongsToSchool) return res.status(404).json({ message: "Student not found in your school" });
    if (!belongsToSchool.classId || belongsToSchool.classId.toString() !== exam.classId.toString()) {
      return res.status(400).json({ message: "This student is not in the exam's class" });
    }

    const marksObtained = Number(req.body.marksObtained);
    if (Number.isNaN(marksObtained) || marksObtained < 0) {
      return res.status(400).json({ message: "Marks obtained must be a valid non-negative number" });
    }
    if (marksObtained > exam.totalMarks) {
      return res.status(400).json({ message: `Marks obtained (${marksObtained}) cannot exceed total marks (${exam.totalMarks})` });
    }

    const existing = await Result.findOne({ examId: req.body.examId, studentId: req.body.studentId });

    if (existing?.isPublished) {
      const canCorrect = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR"].includes(req.user!.role);
      if (!canCorrect) {
        return res.status(403).json({ message: "This result is already published. Ask an academic coordinator or admin to correct it." });
      }
    }

    // Only these fields may be set from marks entry. isPublished/publishedAt
    // must never come from this endpoint's body - that would let a teacher
    // (who is not allowed to call the separate, admin-only publish endpoint)
    // self-publish a result simply by including "isPublished": true in the
    // request, skipping the review/approval step and the parent-notification
    // logic that only the publish endpoint runs.
    const updatePayload = {
      examId: req.body.examId,
      studentId: req.body.studentId,
      marksObtained,
      ...(req.body.grade !== undefined ? { grade: req.body.grade } : {}),
      ...(req.body.remarks !== undefined ? { remarks: req.body.remarks } : {}),
    };

    const result = await Result.findOneAndUpdate(
      { examId: req.body.examId, studentId: req.body.studentId },
      updatePayload,
      { upsert: true, new: true }
    );

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: await actorName(req),
        userRole: req.user.role,
        action: existing ? (existing.isPublished ? "Corrected a published result" : "Updated result") : "Entered result",
        recordType: "Result",
        recordId: result._id.toString(),
        oldValue: existing ? { marksObtained: existing.marksObtained } : undefined,
        newValue: { marksObtained: result.marksObtained },
      });
    }

    if (!existing) {
      const student = await Student.findById(req.body.studentId);
      const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
      if (parent && (parent.userId as any)?._id && student) {
        await notify({
          schoolId: student.schoolId.toString(),
          userId: (parent.userId as any)._id.toString(),
          title: "New result published",
          message: `A new exam result has been published for your child.`,
          category: "ACADEMIC",
        });
      }
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const publishResults = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId: req.user!.schoolId });
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    await Result.updateMany({ examId: req.params.examId }, { isPublished: true, publishedAt: new Date() });

    const results = await Result.find({ examId: req.params.examId }).select("studentId");
    const studentIds = results.map((r) => r.studentId);
    const parents = await Parent.find({ schoolId: req.user!.schoolId, children: { $in: studentIds } }).select("userId children");
    const notified = new Set<string>();
    const toSend: any[] = [];
    parents.forEach((pa) => {
      const uid = pa.userId.toString();
      if (notified.has(uid)) return; // one notice per parent even with several children in the exam
      if (pa.children.some((c) => studentIds.some((sid) => sid.toString() === c.toString()))) {
        notified.add(uid);
        toSend.push({ schoolId: req.user!.schoolId, userId: uid, title: "Result published", message: `${exam.name} results have been published.`, category: "ACADEMIC" as const });
      }
    });
    await notifyMany(toSend);

    if (req.user) {
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: await actorName(req),
        userRole: req.user.role,
        action: `Published results for exam: ${exam.name}`,
        recordType: "Exam",
        recordId: exam._id.toString(),
      });
    }

    res.json({ success: true, count: results.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const student = await Student.findOne({ _id: req.query.studentId as string, schoolId: req.user!.schoolId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const filter: Record<string, any> = { studentId: req.query.studentId as string };
    if (["PARENT", "STUDENT"].includes(req.user!.role)) filter.isPublished = true;

    const results = await Result.find(filter).populate("examId");
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getResultsByExam = async (req: AuthRequest, res: Response) => {
  try {
    const exam = await Exam.findOne({ _id: req.params.examId, schoolId: req.user!.schoolId });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!(await isAssignedToClass(req, exam.classId.toString()))) {
      return res.status(403).json({ message: "You are not assigned to this exam's class" });
    }

    const results = await Result.find({ examId: req.params.examId }).populate({
      path: "studentId",
      populate: { path: "userId", select: "name" },
    });
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createFeeStructure = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, frequency } = req.body;
    const feeType = String(req.body.feeType || "").trim();
    const amount = Number(req.body.amount);
    if (!classId || !feeType || !["MONTHLY", "ONE_TIME", "ANNUAL"].includes(frequency)) {
      return res.status(400).json({ message: "Class, fee type and a valid frequency are required" });
    }
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Fee amount must be a number greater than zero" });
    if (!(await ClassModel.exists({ _id: classId, schoolId }))) return res.status(404).json({ message: "Class not found in your school" });
    const fee = await FeeStructure.create({ schoolId, classId, feeType, amount, frequency });
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    let finalAmount = Number(req.body.amount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return res.status(400).json({ message: "Invoice amount must be a number greater than zero" });
    }
    if (!req.body.feeType || !String(req.body.feeType).trim()) {
      return res.status(400).json({ message: "Fee type is required" });
    }
    if (!req.body.dueDate || Number.isNaN(new Date(req.body.dueDate).getTime())) {
      return res.status(400).json({ message: "A valid due date is required" });
    }
    // The student must belong to the logged-in user's own school. Without
    // this an accountant could bill another school's student (the invoice
    // was stored under their own schoolId but pointed at a foreign student).
    const invoiceStudent = await Student.findOne({ _id: req.body.studentId, schoolId });
    if (!invoiceStudent) return res.status(404).json({ message: "Student not found in your school" });
    const activeDiscount = await Discount.findOne({ schoolId, studentId: req.body.studentId, status: "APPROVED", isActive: true });
    let originalAmount: number | undefined;
    if (activeDiscount) {
      originalAmount = finalAmount;
      if (activeDiscount.percentage) {
        finalAmount = Math.round(finalAmount * (1 - activeDiscount.percentage / 100));
      } else if (activeDiscount.fixedAmount) {
        finalAmount = Math.max(0, finalAmount - activeDiscount.fixedAmount);
      }
    }

    // Only whitelisted fields are taken from the request. The old
    // "...req.body" let a caller set paidAmount, status, paidDate, etc.
    const invoice = await Invoice.create({
      studentId: invoiceStudent._id,
      feeType: String(req.body.feeType).trim(),
      dueDate: req.body.dueDate,
      schoolId,
      amount: finalAmount,
      originalAmount,
      discountApplied: activeDiscount ? activeDiscount._id : undefined,
    });

    const student = await Student.findById(req.body.studentId);
    const parent = await Parent.findOne({ children: req.body.studentId }).populate("userId");
    if (parent && (parent.userId as any)?._id && student) {
      await notify({
        schoolId: student.schoolId.toString(),
        userId: (parent.userId as any)._id.toString(),
        title: "New fee invoice",
        message: `A new ${req.body.feeType} invoice of Rs. ${req.body.amount} has been generated.`,
        category: "FINANCE",
      });
    }

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const bulkCreateInvoices = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { classId, sectionId, feeType, dueDate } = req.body;
    const amount = Number(req.body.amount);
    if (!classId || !feeType || !dueDate || !req.body.amount) {
      return res.status(400).json({ message: "classId, feeType, amount and dueDate are required" });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invoice amount must be a number greater than zero" });
    }

    const filter: Record<string, any> = { schoolId, classId, status: "ACTIVE" };
    if (sectionId) filter.sectionId = sectionId;
    const students = await Student.find(filter);

    if (students.length === 0) {
      return res.status(400).json({ message: "No active students found for this class/section" });
    }

    // Batch version: 4 database calls in total, instead of ~4 per student
    // (a class of 50 used to take 200+ sequential round trips).
    const studentIds = students.map((st) => st._id);
    const already = await Invoice.find({ schoolId, studentId: { $in: studentIds }, feeType, status: { $ne: "CANCELLED" } }).select("studentId");
    const haveInvoice = new Set(already.map((i) => i.studentId.toString()));
    const toCreate = students.filter((st) => !haveInvoice.has(st._id.toString()));
    const skipped = students.length - toCreate.length;
    const created = toCreate.length;

    if (toCreate.length > 0) {
      await Invoice.insertMany(toCreate.map((st) => ({ schoolId, studentId: st._id, feeType, amount, dueDate })));
      const parents = await Parent.find({ schoolId, children: { $in: toCreate.map((st) => st._id) } }).select("userId children");
      const parentOfChild = new Map<string, string>();
      parents.forEach((pa) => pa.children.forEach((c) => { if (!parentOfChild.has(c.toString())) parentOfChild.set(c.toString(), pa.userId.toString()); }));
      await notifyMany(
        toCreate
          .filter((st) => parentOfChild.has(st._id.toString()))
          .map((st) => ({
            schoolId,
            userId: parentOfChild.get(st._id.toString())!,
            title: "New fee invoice",
            message: `A new ${feeType} invoice of Rs. ${amount} has been generated.`,
            category: "FINANCE" as const,
          }))
      );
    }

    res.status(201).json({ message: `Created ${created} invoice(s). ${skipped} student(s) already had this fee type invoiced.`, created, skipped });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getInvoices = async (req: AuthRequest, res: Response) => {
  try {
    // Route is reachable by EVERYONE (incl. STUDENT/PARENT) - without this,
    // any family could see any other student's fee amounts and payment
    // history just by changing the studentId query param.
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const invoices = await Invoice.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Admin/finance-staff only (route-level restriction) - every invoice in
// the school, for exports and full-ledger views rather than one student
// at a time.
export const getAllInvoices = async (req: AuthRequest, res: Response) => {
  try {
    // Paging: ?page=1&limit=500 (limit max 2000, default 2000 so existing
    // screens keep working). X-Total-Count says how many invoices exist in
    // total, so a truncated list can be detected and fetched in full.
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || "2000"), 10) || 2000, 1), 2000);
    const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
    const filter = { schoolId: req.user!.schoolId };
    const [total, invoices] = await Promise.all([
      Invoice.countDocuments(filter),
      Invoice.find(filter)
        .populate({ path: "studentId", populate: { path: "userId" } })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);
    res.setHeader("X-Total-Count", String(total));
    res.setHeader("Access-Control-Expose-Headers", "X-Total-Count");
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint edge case: "Cancelled invoice" - the CANCELLED status has
// existed on the model all along (duplicate-invoice prevention already
// checks for it) but nothing could ever actually set it. A cancelled
// invoice keeps its payment history rather than being deleted - the
// blueprint's fee ledger rule against silently modifying historical
// transactions applies here too.
export const cancelInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "CANCELLED") return res.status(400).json({ message: "This invoice is already cancelled" });
    if ((invoice.paidAmount || 0) > 0) {
      return res.status(400).json({ message: "This invoice has payments recorded against it. Process a refund instead of cancelling it." });
    }

    invoice.status = "CANCELLED";
    await invoice.save();

    if (req.user) {
      const actingUser = await User.findById(req.user.userId).select("name");
      await logAudit({
        schoolId: req.user.schoolId,
        userId: req.user.userId,
        userName: actingUser?.name || "Unknown",
        userRole: req.user.role,
        action: "Cancelled invoice",
        recordType: "Invoice",
        recordId: invoice._id.toString(),
        oldValue: { status: "PENDING" },
        newValue: { status: "CANCELLED" },
      });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const payInvoice = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Invoice.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!existing) return res.status(404).json({ message: "Invoice not found" });

    // canAccessStudent still applies even though this is staff-only now -
    // a FINANCE_STAFF member should only be recording payments for
    // students in their own school (already enforced by the schoolId
    // filter above), kept here as defense in depth.
    const allowed = await canAccessStudent(req, existing.studentId.toString());
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student's invoice" });

    const paymentNow = Number(req.body.amount) || 0;
    if (paymentNow <= 0) return res.status(400).json({ message: "Payment amount must be greater than zero" });
    if (existing.status === "CANCELLED") return res.status(400).json({ message: "This invoice is cancelled and cannot accept payments" });
    const remaining = existing.amount - (existing.paidAmount || 0);
    if (remaining <= 0.005) return res.status(400).json({ message: "This invoice is already fully paid" });
    if (paymentNow > remaining + 0.005) {
      return res.status(400).json({ message: `Payment of Rs. ${paymentNow} is more than the remaining balance of Rs. ${remaining}` });
    }

    // Atomic read-and-write in one step: the previous version read
    // existing.paidAmount, computed the new total in application code, then
    // wrote it back separately. Two payments landing close together could
    // both read the same starting paidAmount and each compute their own
    // "new total" from that stale value - whichever write finished last
    // would silently overwrite (lose) the other payment. $inc lets MongoDB
    // do the addition atomically so no payment can be dropped this way.
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      {
        $inc: { paidAmount: paymentNow },
        $set: { paidDate: new Date() },
      },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    // Safety net for two payments landing at the same moment: the check above
    // reads the balance first, so if the atomic increment pushed the total
    // past the invoice amount, undo this payment and refuse it.
    if ((invoice.paidAmount || 0) > invoice.amount + 0.005) {
      await Invoice.updateOne({ _id: invoice._id }, { $inc: { paidAmount: -paymentNow } });
      return res.status(409).json({ message: "Another payment was recorded at the same time. Please refresh and try again." });
    }
    const newStatus = (invoice.paidAmount || 0) >= invoice.amount ? "PAID" : "PARTIAL";
    if (invoice.status !== newStatus) {
      invoice.status = newStatus;
      await invoice.save();
    }

    if (req.user) {
      await logAudit({
        schoolId: invoice.schoolId.toString(),
        userId: req.user.userId,
        userName: await actorName(req),
        userRole: req.user.role,
        action: "Recorded invoice payment",
        recordType: "Invoice",
        recordId: invoice._id.toString(),
        newValue: { status: invoice.status, paidAmount: invoice.paidAmount, paymentNow },
      });
    }

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// ---------------------------------------------------------------------------
// Submissions: listing for teachers, grading, and "my own" for students.
// Before this, a student could not hand in work from the app, a teacher had no
// way to see what was handed in, and there was nowhere to give marks/feedback.
// ---------------------------------------------------------------------------
const submissionStudentPopulate = { path: "studentId", select: "admissionNumber userId", populate: { path: "userId", select: "name" } };

export const getHomeworkSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const homework = await Homework.findOne({ _id: String(req.query.homeworkId || ""), schoolId: req.user!.schoolId });
    if (!homework) return res.status(404).json({ message: "Homework not found" });
    if (!(await isAssignedToClass(req, homework.classId.toString()))) return res.status(403).json({ message: "You are not assigned to this class" });
    const list = await HomeworkSubmission.find({ homeworkId: homework._id }).populate(submissionStudentPopulate).sort({ submittedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const reviewHomeworkSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const sub = await HomeworkSubmission.findById(req.params.id);
    const homework = sub && (await Homework.findOne({ _id: sub.homeworkId, schoolId: req.user!.schoolId }));
    if (!sub || !homework) return res.status(404).json({ message: "Submission not found" });
    if (!(await isAssignedToClass(req, homework.classId.toString()))) return res.status(403).json({ message: "You are not assigned to this class" });
    sub.status = "COMPLETED";
    if (req.body.feedback !== undefined) sub.feedback = String(req.body.feedback).trim().slice(0, 1000);
    await sub.save();
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAssignmentSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await Assignment.findOne({ _id: String(req.query.assignmentId || ""), schoolId: req.user!.schoolId });
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (!(await isAssignedToClass(req, assignment.classId.toString()))) return res.status(403).json({ message: "You are not assigned to this class" });
    const list = await AssignmentSubmission.find({ assignmentId: assignment._id }).populate(submissionStudentPopulate).sort({ submittedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const gradeAssignmentSubmission = async (req: AuthRequest, res: Response) => {
  try {
    const sub = await AssignmentSubmission.findById(req.params.id);
    const assignment = sub && (await Assignment.findOne({ _id: sub.assignmentId, schoolId: req.user!.schoolId }));
    if (!sub || !assignment) return res.status(404).json({ message: "Submission not found" });
    if (!(await isAssignedToClass(req, assignment.classId.toString()))) return res.status(403).json({ message: "You are not assigned to this class" });
    const marks = Number(req.body.marksObtained);
    if (!Number.isFinite(marks) || marks < 0) return res.status(400).json({ message: "Marks must be zero or more" });
    if (assignment.totalMarks !== undefined && assignment.totalMarks !== null && marks > assignment.totalMarks) {
      return res.status(400).json({ message: `Marks cannot be more than ${assignment.totalMarks}` });
    }
    sub.marksObtained = marks;
    sub.status = "GRADED";
    if (req.body.feedback !== undefined) sub.feedback = String(req.body.feedback).trim().slice(0, 1000);
    await sub.save();
    res.json(sub);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// The logged-in student's own submissions (status, marks, feedback)
export const getMySubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const me = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId }).select("_id");
    if (!me) return res.json({ homework: [], assignments: [] });
    const [homework, assignments] = await Promise.all([
      HomeworkSubmission.find({ studentId: me._id }),
      AssignmentSubmission.find({ studentId: me._id }),
    ]);
    res.json({ homework, assignments });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
