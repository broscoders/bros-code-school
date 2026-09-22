import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

// Blueprint 34 (Attendance): "Teacher/staff: Present, Absent, Late, Early
// departure, Leave" - this covers any staff account (Teacher or
// StaffProfile), linked by userId (the one thing both share) rather than
// duplicating a separate model per role. Mirrors Attendance.ts (the
// student version) in structure and the same unique-index approach
// against duplicate same-day records.
export interface IStaffAttendance extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE";
  markedBy: mongoose.Types.ObjectId;
}

const staffAttendanceSchema = new Schema<IStaffAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

staffAttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IStaffAttendance>("StaffAttendance", staffAttendanceSchema);
