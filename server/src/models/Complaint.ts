import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IComplaint extends Document {
  schoolId: mongoose.Types.ObjectId;
  raisedBy: mongoose.Types.ObjectId;
  category: "ACADEMIC" | "FEE" | "TRANSPORT" | "TEACHER" | "GENERAL" | "TECHNICAL";
  subject: string;
  description: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED";
  ticketNumber: string;
}

const complaintSchema = new Schema<IComplaint>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: ["ACADEMIC", "FEE", "TRANSPORT", "TEACHER", "GENERAL", "TECHNICAL"], required: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["OPEN", "IN_REVIEW", "RESOLVED"], default: "OPEN" },
    ticketNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
complaintSchema.index({ schoolId: 1 });
complaintSchema.index({ schoolId: 1, raisedBy: 1 });

export default mongoose.model<IComplaint>("Complaint", complaintSchema);
