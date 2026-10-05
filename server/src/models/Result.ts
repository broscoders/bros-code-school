import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IResult extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  marksObtained: number;
  grade?: string;
  remarks?: string;
  isPublished: boolean;
  publishedAt?: Date;
}

const resultSchema = new Schema<IResult>(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    marksObtained: { type: Number, required: true },
    grade: { type: String },
    remarks: { type: String },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
resultSchema.index({ examId: 1 });
resultSchema.index({ studentId: 1 });

export default mongoose.model<IResult>("Result", resultSchema);
