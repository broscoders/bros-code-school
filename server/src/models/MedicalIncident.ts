import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IMedicalIncident extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  incidentDate: Date;
  description: string;
  actionTaken: string;
  recordedBy: mongoose.Types.ObjectId;
}

const medicalIncidentSchema = new Schema<IMedicalIncident>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    incidentDate: { type: Date, default: Date.now },
    description: { type: String, required: true },
    actionTaken: { type: String, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMedicalIncident>("MedicalIncident", medicalIncidentSchema);
