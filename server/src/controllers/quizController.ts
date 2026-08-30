import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent } from "../utils/accessControl";
import Quiz from "../models/Quiz";
import QuizAttempt from "../models/QuizAttempt";
import Student from "../models/Student";
import Teacher from "../models/Teacher";

export const createQuiz = async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getQuizzesForTeacher = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.query.teacherId as string;
    // Includes correctOptionIndex (no field exclusion, unlike the student-
    // facing endpoint below) - so without this check, any teacher could
    // read another teacher's unpublished quizzes, answer key included, by
    // passing a different teacherId.
    const myTeacher = await Teacher.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    const isOwnQuizzes = myTeacher && myTeacher._id.toString() === teacherId;
    const isAdmin = ["SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ACADEMIC_COORDINATOR"].includes(req.user!.role);
    if (!isOwnQuizzes && !isAdmin) {
      return res.status(403).json({ message: "You can only view your own quizzes" });
    }

    const quizzes = await Quiz.find({ schoolId: req.user!.schoolId, createdBy: teacherId })
      .populate("classId sectionId subjectId")
      .sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getQuizzesForClass = async (req: AuthRequest, res: Response) => {
  try {
    const quizzes = await Quiz.find({
      schoolId: req.user!.schoolId,
      classId: req.query.classId as string,
      isPublished: true,
    })
      .select("-questions.correctOptionIndex")
      .populate("subjectId")
      .sort({ createdAt: -1 });

    const studentId = req.query.studentId as string;
    if (studentId) {
      const allowed = await canAccessStudent(req, studentId);
      if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });
    }
    const attempts = studentId
      ? await QuizAttempt.find({ studentId, quizId: { $in: quizzes.map((q) => q._id) } })
      : [];

    const result = quizzes.map((q: any) => {
      const attempt = attempts.find((a) => a.quizId.toString() === q._id.toString());
      return {
        ...q.toObject(),
        questionCount: q.questions.length,
        questions: undefined,
        myAttemptStatus: attempt?.status || null,
        myScore: attempt?.status === "SUBMITTED" ? attempt.score : null,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const togglePublish = async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { isPublished: req.body.isPublished },
      { new: true }
    );
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const startAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.body;
    const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    if (!myStudent) return res.status(403).json({ message: "Student profile not found" });
    const studentId = myStudent._id.toString();

    const quiz = await Quiz.findOne({ _id: quizId, schoolId: req.user!.schoolId, isPublished: true });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let attempt = await QuizAttempt.findOne({ quizId, studentId });

    if (attempt?.status === "SUBMITTED" && !quiz.allowRetake) {
      return res.status(400).json({ message: "You have already submitted this quiz." });
    }

    if (!attempt || (attempt.status === "SUBMITTED" && quiz.allowRetake)) {
      attempt = await QuizAttempt.findOneAndUpdate(
        { quizId, studentId },
        { schoolId: req.user!.schoolId, quizId, studentId, answers: [], totalQuestions: quiz.questions.length, status: "IN_PROGRESS", startedAt: new Date(), submittedAt: undefined },
        { upsert: true, new: true }
      );
    }

    const safeQuestions = quiz.questions.map((q) => ({ questionText: q.questionText, options: q.options }));

    res.json({
      attemptId: attempt!._id,
      quizTitle: quiz.title,
      timeLimitMinutes: quiz.timeLimitMinutes,
      startedAt: attempt!.startedAt,
      questions: safeQuestions,
      existingAnswers: attempt!.answers,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const submitAttempt = async (req: AuthRequest, res: Response) => {
  try {
    const { attemptId, answers } = req.body;
    const myStudent = await Student.findOne({ userId: req.user!.userId, schoolId: req.user!.schoolId });
    if (!myStudent) return res.status(403).json({ message: "Student profile not found" });

    const attempt = await QuizAttempt.findOne({ _id: attemptId, schoolId: req.user!.schoolId });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    // Without this, any student could submit answers on ANOTHER student's
    // in-progress attempt just by knowing/guessing its attemptId - route-
    // level "must be a STUDENT" doesn't verify it's *this* student's attempt.
    if (attempt.studentId.toString() !== myStudent._id.toString()) {
      return res.status(403).json({ message: "This is not your quiz attempt" });
    }
    if (attempt.status === "SUBMITTED") return res.status(400).json({ message: "This attempt was already submitted." });

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctOptionIndex) score += 1;
    });

    attempt.answers = answers;
    attempt.score = score;
    attempt.status = "SUBMITTED";
    attempt.submittedAt = new Date();
    await attempt.save();

    res.json({ score, totalQuestions: quiz.questions.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getQuizResults = async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const attempts = await QuizAttempt.find({ quizId: req.params.id, status: "SUBMITTED" })
      .populate({ path: "studentId", populate: { path: "userId" } })
      .sort({ score: -1 });

    res.json(attempts);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
