import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IQuizAttempt extends Document {
  schoolId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  attemptNumber: number;
  // Mixed so each entry can be either a selected option index (MCQ) or the
  // typed text (SHORT_ANSWER) - existing attempts with plain numbers still
  // read back fine since Mixed accepts both.
  answers: any[];
  score?: number;
  totalQuestions: number;
  status: "IN_PROGRESS" | "SUBMITTED";
  // True when at least one short-answer response couldn't be confidently
  // auto-graded and a teacher should look at it before the score is final.
  needsReview: boolean;
  startedAt: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    // Each retake is its own attempt document now (rather than reusing a
    // single per-student-per-quiz record), so a full attempt history is
    // preserved per the blueprint's "Results, History" requirement, and
    // maxAttempts on the Quiz can be enforced by counting these.
    attemptNumber: { type: Number, required: true, default: 1 },
    answers: [{ type: Schema.Types.Mixed }],
    score: { type: Number },
    totalQuestions: { type: Number, required: true },
    status: { type: String, enum: ["IN_PROGRESS", "SUBMITTED"], default: "IN_PROGRESS" },
    needsReview: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quizId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });

export default mongoose.model<IQuizAttempt>("QuizAttempt", quizAttemptSchema);
