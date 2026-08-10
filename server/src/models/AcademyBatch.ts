import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAcademyBatch extends Document {
  schoolId: mongoose.Types.ObjectId;
  programId: mongoose.Types.ObjectId;
  name: string;
  days: string[];
  startTime: string;
  endTime: string;
  teacherId: mongoose.Types.ObjectId;
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
  },
  { timestamps: true }
);

export default mongoose.model<IAcademyBatch>("AcademyBatch", academyBatchSchema);
