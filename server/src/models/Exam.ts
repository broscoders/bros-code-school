import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IExam extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  name: string;
  examType: "QUIZ" | "TEST" | "MIDTERM" | "FINAL" | "PRACTICAL" | "ASSIGNMENT";
  date: Date;
  totalMarks: number;
}

const examSchema = new Schema<IExam>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    name: { type: String, required: true },
    examType: { type: String, enum: ["QUIZ", "TEST", "MIDTERM", "FINAL", "PRACTICAL", "ASSIGNMENT"], required: true },
    date: { type: Date, required: true },
    totalMarks: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IExam>("Exam", examSchema);
