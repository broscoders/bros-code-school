import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAcademyEnrollment extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  enrollmentDate: Date;
  isActive: boolean;
}

const academyEnrollmentSchema = new Schema<IAcademyEnrollment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "AcademyBatch", required: true },
    enrollmentDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAcademyEnrollment>("AcademyEnrollment", academyEnrollmentSchema);
