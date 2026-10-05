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

// Enforced at the database level, not just in application code - even if
// two "mark attendance" requests for the same student on the same day
// somehow race each other, Mongo guarantees only one document survives
// rather than silently allowing duplicate attendance rows.
attendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
attendanceSchema.index({ schoolId: 1 });
attendanceSchema.index({ schoolId: 1, classId: 1, sectionId: 1, date: 1 });
attendanceSchema.index({ schoolId: 1, date: 1 });

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
