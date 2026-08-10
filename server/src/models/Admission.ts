import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAdmission extends Document {
  schoolId: mongoose.Types.ObjectId;
  applicantName: string;
  parentName: string;
  parentContact: string;
  desiredClassId: mongoose.Types.ObjectId;
  academicSystem: string;
  documents?: string[];
  notes?: string;
  status: "APPLICATION" | "REVIEW" | "INTERVIEW" | "APPROVED" | "REJECTED" | "CONVERTED";
}

const admissionSchema = new Schema<IAdmission>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    applicantName: { type: String, required: true },
    parentName: { type: String, required: true },
    parentContact: { type: String, required: true },
    desiredClassId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    academicSystem: { type: String, required: true },
    documents: [{ type: String }],
    notes: { type: String },
    status: { type: String, enum: ["APPLICATION", "REVIEW", "INTERVIEW", "APPROVED", "REJECTED", "CONVERTED"], default: "APPLICATION" },
  },
  { timestamps: true }
);

export default mongoose.model<IAdmission>("Admission", admissionSchema);
