import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAcademicSession extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const academicSessionSchema = new Schema<IAcademicSession>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAcademicSession>("AcademicSession", academicSessionSchema);
