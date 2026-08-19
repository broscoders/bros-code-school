import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IQuizAttempt extends Document {
  schoolId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: number[];
  score?: number;
  totalQuestions: number;
  status: "IN_PROGRESS" | "SUBMITTED";
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
    answers: { type: [Number], default: [] },
    score: { type: Number },
    totalQuestions: { type: Number, required: true },
    status: { type: String, enum: ["IN_PROGRESS", "SUBMITTED"], default: "IN_PROGRESS" },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<IQuizAttempt>("QuizAttempt", quizAttemptSchema);
