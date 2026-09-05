import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type MedicalIncidentSeverity = "MINOR" | "MODERATE" | "SEVERE" | "EMERGENCY";
export type MedicalIncidentStatus = "OPEN" | "MONITORING" | "RESOLVED" | "REFERRED_TO_HOSPITAL";

export interface IMedicalIncident extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  incidentDate: Date;
  description: string;
  actionTaken: string;
  severity: MedicalIncidentSeverity;
  status: MedicalIncidentStatus;
  parentNotified: boolean;
  followUpRequired: boolean;
  followUpNotes?: string;
  recordedBy: mongoose.Types.ObjectId;
}

const medicalIncidentSchema = new Schema<IMedicalIncident>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    incidentDate: { type: Date, default: Date.now },
    description: { type: String, required: true },
    actionTaken: { type: String, required: true },
    severity: { type: String, enum: ["MINOR", "MODERATE", "SEVERE", "EMERGENCY"], default: "MINOR" },
    status: { type: String, enum: ["OPEN", "MONITORING", "RESOLVED", "REFERRED_TO_HOSPITAL"], default: "OPEN" },
    parentNotified: { type: Boolean, default: false },
    followUpRequired: { type: Boolean, default: false },
    followUpNotes: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMedicalIncident>("MedicalIncident", medicalIncidentSchema);
