import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent, isAssignedToClass, isOwnClass } from "../utils/accessControl";
import Subject from "../models/Subject";
import Course from "../models/Course";
import Lesson from "../models/Lesson";
import LessonProgress from "../models/LessonProgress";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import Certificate from "../models/Certificate";

const ADMIN_ROLES = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR"];

// A course can be changed only by the teacher who created it, or by admins.
async function canManageCourse(req: AuthRequest, course: { createdBy?: any }) {
  if (ADMIN_ROLES.includes(req.user!.role)) return true;
  const me = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
  return !!me && me._id.toString() === course.createdBy?.toString();
}

export const createCourse = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { title, description, classId, subjectId } = req.body;
    if (!title || !String(title).trim()) return res.status(400).json({ message: "Course title is required" });
    // classId is optional (a course can target "any class"), but if one is
    // given a plain TEACHER must be assigned to it and the subject must
    // belong to that class.
    if (classId && !(await isAssignedToClass(req, classId))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }
    if (subjectId) {
      const subject = await Subject.findOne({ _id: subjectId, schoolId, ...(classId ? { classId } : {}) });
      if (!subject) return res.status(404).json({ message: "Subject not found" });
    }
    // createdBy comes from the login, never from the request body
    const teacher = await Teacher.findOne({ userId: req.user!.userId, schoolId });
    if (!teacher) return res.status(403).json({ message: "Only users with a teacher profile can create courses" });

    const course = await Course.create({
      schoolId,
      title: String(title).trim(),
      description,
      classId: classId || undefined,
      subjectId: subjectId || undefined,
      createdBy: teacher._id,
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// School-wide oversight for admins/principals - the existing endpoints
// only return "my courses" (teacher) or "this class's courses" (student),
// neither of which lets an admin see LMS activity across the school.
export const getAllCoursesForSchool = async (req: AuthRequest, res: Response) => {
  try {
    const courses = await Course.find({ schoolId: req.user!.schoolId })
      .populate({ path: "createdBy", select: "userId", populate: { path: "userId", select: "name" } })
      .populate("classId", "name")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });

    const withCounts = await Promise.all(
      courses.map(async (c) => {
        const lessonCount = await Lesson.countDocuments({ courseId: c._id });
        return { ...c.toObject(), lessonCount };
      })
    );

    res.json(withCounts);
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
    const classIdParam = req.query.classId as string | undefined;
    if (!classIdParam) return res.status(400).json({ message: "classId is required" });
    if (req.user!.role === "STUDENT" && !(await isOwnClass(req, classIdParam))) {
      return res.status(403).json({ message: "You can only view courses of your own class" });
    }
    if (!(await isAssignedToClass(req, classIdParam))) {
      return res.status(403).json({ message: "You are not assigned to this class" });
    }
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
    if (typeof req.body.isPublished !== "boolean") return res.status(400).json({ message: "isPublished must be true or false" });
    const course = await Course.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!(await canManageCourse(req, course))) return res.status(403).json({ message: "You can only publish your own courses" });
    course.isPublished = req.body.isPublished;
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const addLesson = async (req: AuthRequest, res: Response) => {
  try {
    const { courseId, moduleName, title, contentType, contentUrl, textContent } = req.body;
    const course = await Course.findOne({ _id: courseId, schoolId: req.user!.schoolId });
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!(await canManageCourse(req, course))) return res.status(403).json({ message: "You can only add lessons to your own courses" });

    if (!title || !String(title).trim()) return res.status(400).json({ message: "Lesson title is required" });
    const type = contentType || "TEXT";
    if (!["TEXT", "VIDEO", "PDF", "LINK"].includes(type)) return res.status(400).json({ message: "Invalid content type" });
    if (type === "TEXT" && !String(textContent || "").trim()) return res.status(400).json({ message: "Lesson content is required" });
    if (type !== "TEXT") {
      if (!contentUrl) return res.status(400).json({ message: type === "PDF" ? "Please upload a file" : "Please enter a URL" });
      if (!/^https?:\/\//i.test(String(contentUrl))) return res.status(400).json({ message: "URL must start with http:// or https://" });
    }

    const last = await Lesson.findOne({ courseId }).sort({ order: -1 }).select("order");
    const lesson = await Lesson.create({
      schoolId: req.user!.schoolId,
      courseId,
      moduleName,
      title: String(title).trim(),
      contentType: type,
      contentUrl: type === "TEXT" ? undefined : contentUrl,
      textContent: type === "TEXT" ? textContent : undefined,
      order: last ? (last.order ?? 0) + 1 : 0,
    });
    res.status(201).json(lesson);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getLessons = async (req: AuthRequest, res: Response) => {
  try {
    const course = await Course.findOne({ _id: req.query.courseId as string, schoolId: req.user!.schoolId });
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (req.user!.role === "STUDENT") {
      // students only see published courses of their own class
      if (!course.isPublished) return res.status(404).json({ message: "Course not found" });
      if (course.classId && !(await isOwnClass(req, course.classId.toString()))) {
        return res.status(403).json({ message: "This course is not for your class" });
      }
    } else if (!(await canManageCourse(req, course))) {
      return res.status(403).json({ message: "You can only view lessons of your own courses" });
    }

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
    const lesson = await Lesson.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    const course = await Course.findOne({ _id: lesson.courseId, schoolId: req.user!.schoolId });
    if (!course || !(await canManageCourse(req, course))) {
      return res.status(403).json({ message: "You can only delete lessons of your own courses" });
    }
    await lesson.deleteOne();
    // progress rows for a deleted lesson would otherwise inflate completion counts
    await LessonProgress.deleteMany({ lessonId: lesson._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markLessonProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId, status } = req.body;
    if (!["IN_PROGRESS", "COMPLETED"].includes(status)) return res.status(400).json({ message: "Invalid status" });
    const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    if (!myStudent) return res.status(403).json({ message: "Student profile not found" });
    const studentId = myStudent._id.toString();

    // The course is taken from the LESSON itself, not from the request.
    // courseId and lessonId used to come straight from the browser, so a
    // student could post COMPLETED for made-up lesson ids until the count
    // reached the course's total and receive the completion certificate
    // without opening a single lesson.
    const lesson = await Lesson.findOne({ _id: lessonId, schoolId: req.user!.schoolId });
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });
    const courseId = lesson.courseId.toString();
    const ownCourse = await Course.findOne({ _id: courseId, schoolId: req.user!.schoolId, isPublished: true });
    if (!ownCourse) return res.status(404).json({ message: "Course not found" });
    if (ownCourse.classId && (!myStudent.classId || myStudent.classId.toString() !== ownCourse.classId.toString())) {
      return res.status(403).json({ message: "This course is not for your class" });
    }

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
          certificateNumber: "CERT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
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