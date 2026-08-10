import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAssignment extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  instructions?: string;
  attachmentUrl?: string;
  totalMarks?: number;
  dueDate: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    title: { type: String, required: true },
    instructions: { type: String },
    attachmentUrl: { type: String },
    totalMarks: { type: Number },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);
