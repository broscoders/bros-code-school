import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IHomework extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  attachmentUrl?: string;
  dueDate: Date;
}

const homeworkSchema = new Schema<IHomework>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    title: { type: String, required: true },
    description: { type: String },
    attachmentUrl: { type: String },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
homeworkSchema.index({ schoolId: 1 });
homeworkSchema.index({ schoolId: 1, classId: 1, sectionId: 1 });

export default mongoose.model<IHomework>("Homework", homeworkSchema);
