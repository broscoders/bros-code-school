import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ISubject extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  name: string;
  code?: string;
}

const subjectSchema = new Schema<ISubject>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    name: { type: String, required: true },
    code: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISubject>("Subject", subjectSchema);
