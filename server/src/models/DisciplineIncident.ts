import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IDisciplineIncident extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  incidentType: "WARNING" | "MINOR" | "MAJOR";
  description: string;
  actionTaken?: string;
  parentNotified: boolean;
  status: "OPEN" | "RESOLVED";
}

const disciplineSchema = new Schema<IDisciplineIncident>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    incidentType: { type: String, enum: ["WARNING", "MINOR", "MAJOR"], required: true },
    description: { type: String, required: true },
    actionTaken: { type: String },
    parentNotified: { type: Boolean, default: false },
    status: { type: String, enum: ["OPEN", "RESOLVED"], default: "OPEN" },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
disciplineSchema.index({ schoolId: 1 });

export default mongoose.model<IDisciplineIncident>("DisciplineIncident", disciplineSchema);
