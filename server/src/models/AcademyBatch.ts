import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type AcademyBatchStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface IAcademyBatch extends Document {
  schoolId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  name: string;
  days: string[];
  startTime: string;
  endTime: string;
  teacherId: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  capacity?: number;
  room?: string;
  status: AcademyBatchStatus;
}

const academyBatchSchema = new Schema<IAcademyBatch>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    programId: { type: Schema.Types.ObjectId, ref: "AcademyProgram", required: true },
    name: { type: String, required: true },
    days: [{ type: String }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    // Optional (undefined/0 = unlimited) so existing batches created before
    // this field existed keep accepting enrollments unchanged.
    capacity: { type: Number },
    room: { type: String },
    status: { type: String, enum: ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"], default: "UPCOMING" },
  },
  { timestamps: true }
);

export default mongoose.model<IAcademyBatch>("AcademyBatch", academyBatchSchema);
