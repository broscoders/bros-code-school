import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAnnouncement extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  targetAudience: "ALL" | "PARENTS" | "STUDENTS" | "TEACHERS" | "CLASS" | "ACADEMY";
  classId?: mongoose.Types.ObjectId;
  publishAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetAudience: { type: String, enum: ["ALL", "PARENTS", "STUDENTS", "TEACHERS", "CLASS", "ACADEMY"], required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel" },
    publishAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAnnouncement>("Announcement", announcementSchema);
