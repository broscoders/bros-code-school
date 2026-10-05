import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IClass extends Document {
  schoolId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
  name: string;
  academicSystem: string;
}

const classSchema = new Schema<IClass>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "AcademicSession", required: true },
    name: { type: String, required: true },
    academicSystem: { type: String, required: true },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
classSchema.index({ schoolId: 1 });

export default mongoose.model<IClass>("ClassModel", classSchema);
