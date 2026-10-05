import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IHealthProfile extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  bloodGroup?: string;
  allergies?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
}

const healthProfileSchema = new Schema<IHealthProfile>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, unique: true },
    bloodGroup: { type: String },
    allergies: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    medicalNotes: { type: String },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
healthProfileSchema.index({ schoolId: 1 });

export default mongoose.model<IHealthProfile>("HealthProfile", healthProfileSchema);
