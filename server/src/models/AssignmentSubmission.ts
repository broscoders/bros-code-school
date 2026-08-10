import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAssignmentSubmission extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submissionUrl?: string;
  marksObtained?: number;
  feedback?: string;
  status: "PENDING" | "SUBMITTED" | "GRADED";
  submittedAt?: Date;
}

const assignmentSubmissionSchema = new Schema<IAssignmentSubmission>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    submissionUrl: { type: String },
    marksObtained: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ["PENDING", "SUBMITTED", "GRADED"], default: "PENDING" },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignmentSubmission>("AssignmentSubmission", assignmentSubmissionSchema);
