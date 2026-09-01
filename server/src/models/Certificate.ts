import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ICertificate extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  title: string;
  type: "COMPLETION" | "ACHIEVEMENT" | "PARTICIPATION" | "CUSTOM";
  certificateNumber: string;
  issueDate: Date;
  fileUrl?: string;
  // Set only for course-completion certificates auto-issued by the LMS, so
  // that module can check "has this student already gotten a certificate
  // for this course" without parsing the title string.
  courseId?: mongoose.Types.ObjectId;
}

const certificateSchema = new Schema<ICertificate>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    title: { type: String, required: true },
    type: { type: String, enum: ["COMPLETION", "ACHIEVEMENT", "PARTICIPATION", "CUSTOM"], required: true },
    certificateNumber: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    fileUrl: { type: String },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
  },
  { timestamps: true }
);

export default mongoose.model<ICertificate>("Certificate", certificateSchema);
