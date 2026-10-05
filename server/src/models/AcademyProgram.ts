import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAcademyProgram extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
}

const academyProgramSchema = new Schema<IAcademyProgram>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
academyProgramSchema.index({ schoolId: 1 });

export default mongoose.model<IAcademyProgram>("AcademyProgram", academyProgramSchema);
