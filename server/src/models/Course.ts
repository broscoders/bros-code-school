import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ICourse extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const courseSchema = new Schema<ICourse>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    title: { type: String, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>("Course", courseSchema);
