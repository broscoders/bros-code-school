import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IHomeworkSubmission extends Document {
  homeworkId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  submissionUrl?: string;
  status: "PENDING" | "SUBMITTED" | "COMPLETED" | "OVERDUE";
  feedback?: string;
  submittedAt?: Date;
}

const homeworkSubmissionSchema = new Schema<IHomeworkSubmission>(
  {
    homeworkId: { type: Schema.Types.ObjectId, ref: "Homework", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    submissionUrl: { type: String },
    status: { type: String, enum: ["PENDING", "SUBMITTED", "COMPLETED", "OVERDUE"], default: "PENDING" },
    feedback: { type: String },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IHomeworkSubmission>("HomeworkSubmission", homeworkSubmissionSchema);
