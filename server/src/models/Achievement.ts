import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAchievement extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  title: string;
  category: "ACADEMIC" | "SPORTS" | "COMPETITION" | "APPRECIATION" | "PARTICIPATION";
  description?: string;
  dateAwarded: Date;
  certificateUrl?: string;
}

const achievementSchema = new Schema<IAchievement>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    title: { type: String, required: true },
    category: { type: String, enum: ["ACADEMIC", "SPORTS", "COMPETITION", "APPRECIATION", "PARTICIPATION"], required: true },
    description: { type: String },
    dateAwarded: { type: Date, default: Date.now },
    certificateUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAchievement>("Achievement", achievementSchema);
