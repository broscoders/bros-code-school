import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAcademicSession extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  status: "ACTIVE" | "CLOSED" | "ARCHIVED";
}

const academicSessionSchema = new Schema<IAcademicSession>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    // Separate from isActive (kept for backward compatibility with any
    // existing code reading it) so a session can be explicitly CLOSED
    // (teaching finished, results finalized) before being ARCHIVED
    // (put away for good, per blueprint 19's "close then archive" flow) -
    // closing/archiving never deletes attendance/fees/exam history, it
    // only changes which session new records default into.
    status: { type: String, enum: ["ACTIVE", "CLOSED", "ARCHIVED"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export default mongoose.model<IAcademicSession>("AcademicSession", academicSessionSchema);
