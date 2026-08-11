import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ILeaveRequest extends Document {
  schoolId: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  reason: string;
  date: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
  type: "STUDENT" | "TEACHER";
}

const leaveRequestSchema = new Schema<ILeaveRequest>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
    reason: { type: String, required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    type: { type: String, enum: ["STUDENT", "TEACHER"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ILeaveRequest>("LeaveRequest", leaveRequestSchema);
