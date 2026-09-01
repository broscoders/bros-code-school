import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IQuizQuestion {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
}

export interface IQuiz extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  questions: IQuizQuestion[];
  createdBy: mongoose.Types.ObjectId;
  isPublished: boolean;
  allowRetake: boolean;
  // Optional explicit cap on attempts. When unset, behavior falls back to
  // allowRetake (true = unlimited, false = a single attempt) so existing
  // quizzes created before this field existed keep working unchanged.
  maxAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true },
  },
  { _id: false }
);

const quizSchema = new Schema<IQuiz>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    title: { type: String, required: true },
    description: { type: String },
    timeLimitMinutes: { type: Number, required: true, default: 20 },
    questions: { type: [quizQuestionSchema], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    isPublished: { type: Boolean, default: false },
    allowRetake: { type: Boolean, default: false },
    maxAttempts: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<IQuiz>("Quiz", quizSchema);
