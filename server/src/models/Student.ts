import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IStudent extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  admissionNumber: string;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  admissionDate: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    admissionNumber: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Parent" },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: { type: String },
    admissionDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>("Student", studentSchema);
