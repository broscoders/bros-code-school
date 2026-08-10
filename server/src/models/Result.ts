import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IResult extends Document {
  examId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  marksObtained: number;
  grade?: string;
  remarks?: string;
}

const resultSchema = new Schema<IResult>(
  {
    examId: { type: Schema.Types.ObjectId, ref: "Exam", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    marksObtained: { type: Number, required: true },
    grade: { type: String },
    remarks: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IResult>("Result", resultSchema);
