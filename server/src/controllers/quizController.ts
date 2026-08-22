import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Quiz from "../models/Quiz";
import QuizAttempt from "../models/QuizAttempt";
import Student from "../models/Student";

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
    const quizzes = await Quiz.find({ schoolId: req.user!.schoolId, createdBy: req.query.teacherId as string })
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
    const attempt = await QuizAttempt.findOne({ _id: attemptId, schoolId: req.user!.schoolId });
    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
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
