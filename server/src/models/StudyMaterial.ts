import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IStudyMaterial extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  chapter?: string;
  fileUrl: string;
}

const studyMaterialSchema = new Schema<IStudyMaterial>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    title: { type: String, required: true },
    chapter: { type: String },
    fileUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStudyMaterial>("StudyMaterial", studyMaterialSchema);
