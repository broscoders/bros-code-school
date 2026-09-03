import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import CurriculumTopic from "../models/CurriculumTopic";

// Any teacher may add topics (route-level: TEACHING_STAFF). We do not
// restrict this to "only the teacher assigned to this subject" the way
// results/quizzes are - unlike a quiz's answer key or a private grade, a
// syllabus topic list is departmental content other teachers of the same
// class/subject legitimately need to see and add to together.
export const addTopic = async (req: AuthRequest, res: Response) => {
  try {
    const { academicSessionId, classId, subjectId, chapterName, topicName, order } = req.body;
    if (!chapterName || !topicName) {
      return res.status(400).json({ message: "Chapter name and topic name are required" });
    }
    const topic = await CurriculumTopic.create({
      schoolId: req.user!.schoolId,
      academicSessionId,
      classId,
      subjectId,
      chapterName,
      topicName,
      order: order || 0,
      updatedBy: req.user!.userId,
    });
    res.status(201).json(topic);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getTopics = async (req: AuthRequest, res: Response) => {
  try {
    const classId = req.query.classId as string;
    const subjectId = req.query.subjectId as string;
    const academicSessionId = req.query.academicSessionId as string | undefined;
    const topics = await CurriculumTopic.find({
      schoolId: req.user!.schoolId,
      classId,
      subjectId,
      ...(academicSessionId ? { academicSessionId } : {}),
    }).sort({ chapterName: 1, order: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateTopicStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, teacherNotes } = req.body;
    if (!["NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const topic = await CurriculumTopic.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      {
        status,
        ...(teacherNotes !== undefined ? { teacherNotes } : {}),
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {}),
        updatedBy: req.user!.userId,
      },
      { new: true }
    );
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteTopic = async (req: AuthRequest, res: Response) => {
  try {
    const topic = await CurriculumTopic.findOneAndDelete({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!topic) return res.status(404).json({ message: "Topic not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Admin-facing: percent-complete per class/subject combination, so a
// principal can see "Grade 8 Science is 40% through its syllabus" at a
// glance rather than opening every subject's topic list individually.
export const getCurriculumProgressSummary = async (req: AuthRequest, res: Response) => {
  try {
    const topics = await CurriculumTopic.find({ schoolId: req.user!.schoolId })
      .populate("classId", "name")
      .populate("subjectId", "name");

    const byKey: Record<string, { className: string; subjectName: string; total: number; completed: number; inProgress: number }> = {};
    for (const t of topics as any[]) {
      const key = `${t.classId?._id}-${t.subjectId?._id}`;
      if (!byKey[key]) {
        byKey[key] = { className: t.classId?.name || "-", subjectName: t.subjectId?.name || "-", total: 0, completed: 0, inProgress: 0 };
      }
      byKey[key].total++;
      if (t.status === "COMPLETED") byKey[key].completed++;
      if (t.status === "IN_PROGRESS") byKey[key].inProgress++;
    }

    const summary = Object.values(byKey).map((v) => ({
      ...v,
      percentComplete: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
    }));

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
