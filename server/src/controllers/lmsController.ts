import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent } from "../utils/accessControl";
import Course from "../models/Course";
import Lesson from "../models/Lesson";
import LessonProgress from "../models/LessonProgress";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Certificate from "../models/Certificate";

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getCoursesForTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.query.teacherId as string;
    const myTeacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    const isOwnCourses = myTeacher && myTeacher._id.toString() === teacherId;
    const isAdmin = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR"].includes(req.user!.role);
    if (!isOwnCourses && !isAdmin) {
      return res.status(403).json({ message: "You can only view your own courses" });
    }

    const courses = await Course.find({ schoolId: req.user!.schoolId, createdBy: teacherId })
      .populate("classId subjectId")
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getCoursesForClass = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({
      schoolId: req.user!.schoolId,
      classId: req.query.classId as string,
      isPublished: true,
    }).populate("subjectId");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const togglePublishCourse = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { isPublished: req.body.isPublished },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const addLesson = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findOne({ _id: req.body.courseId, schoolId: req.user!.schoolId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const lessonCount = await Lesson.countDocuments({ courseId: req.body.courseId });
    const lesson = await Lesson.create({ ...req.body, schoolId: req.user!.schoolId, order: lessonCount });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getLessons = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findOne({ _id: req.query.courseId as string, schoolId: req.user!.schoolId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const lessons = await Lesson.find({ courseId: req.query.courseId as string }).sort({ order: 1 });

    const studentId = req.query.studentId as string;
    if (studentId) {
      const allowed = await canAccessStudent(req, studentId);
      if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

      const progress = await LessonProgress.find({ studentId, lessonId: { $in: lessons.map((l) => l._id) } });
      const withProgress = lessons.map((l) => ({
        ...l.toObject(),
        myStatus: progress.find((p) => p.lessonId.toString() === l._id.toString())?.status || "NOT_STARTED",
      }));
      return res.json(withProgress);
    }

    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteLesson = async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await Lesson.findOneAndDelete({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markLessonProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId, courseId, status } = req.body;
    const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    if (!myStudent) return res.status(403).json({ message: "Student profile not found" });
    const studentId = myStudent._id.toString();
    const progress = await LessonProgress.findOneAndUpdate(
      { studentId, lessonId },
      {
        schoolId: req.user!.schoolId,
        studentId,
        courseId,
        lessonId,
        status,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
      },
      { upsert: true, new: true }
    );

    // Blueprint 80 ties a course's "Certificate eligibility" to finishing
    // it - completing the last remaining lesson now auto-issues a
    // completion certificate, once, the same way a staff member issuing one
    // manually would (same model, same numbering scheme).
    let issuedCertificate = null;
    if (status === "COMPLETED") {
      const [course, totalLessons, completedCount, alreadyIssued] = await Promise.all([
        Course.findById(courseId),
        Lesson.countDocuments({ courseId }),
        LessonProgress.countDocuments({ studentId, courseId, status: "COMPLETED" }),
        Certificate.findOne({ schoolId: req.user!.schoolId, studentId, courseId }),
      ]);
      if (course && totalLessons > 0 && completedCount >= totalLessons && !alreadyIssued) {
        issuedCertificate = await Certificate.create({
          schoolId: req.user!.schoolId,
          studentId,
          title: `Course Completion: ${course.title}`,
          type: "COMPLETION",
          certificateNumber: `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          issueDate: new Date(),
          courseId,
        });
      }
    }

    res.status(201).json({ ...progress.toObject(), issuedCertificate });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getCourseProgressSummary = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    const myTeacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    const isOwner = myTeacher && myTeacher._id.toString() === course.createdBy?.toString();
    const isAdmin = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR"].includes(req.user!.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You can only view progress for your own courses" });
    }

    const lessons = await Lesson.find({ courseId: req.params.id });
    const progress = await LessonProgress.find({ courseId: req.params.id, status: "COMPLETED" })
      .populate({ path: "studentId", populate: { path: "userId" } });

    const byStudent: Record<string, { name: string; completedCount: number }> = {};
    progress.forEach((p: any) => {
      const key = p.studentId?._id?.toString();
      if (!key) return;
      if (!byStudent[key]) byStudent[key] = { name: p.studentId.userId?.name || "Unknown", completedCount: 0 };
      byStudent[key].completedCount += 1;
    });

    res.json({
      totalLessons: lessons.length,
      students: Object.values(byStudent),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};