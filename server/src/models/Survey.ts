import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ISurvey extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  questions: string[];
  targetAudience: "PARENTS" | "STUDENTS" | "TEACHERS" | "ALL";
  isActive: boolean;
}

const surveySchema = new Schema<ISurvey>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: [{ type: String, required: true }],
    targetAudience: { type: String, enum: ["PARENTS", "STUDENTS", "TEACHERS", "ALL"], default: "ALL" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISurvey>("Survey", surveySchema);
