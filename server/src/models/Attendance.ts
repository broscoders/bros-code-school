import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAttendance extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  date: Date;
  status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
  markedBy: mongoose.Types.ObjectId;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT", "LATE", "LEAVE"], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
