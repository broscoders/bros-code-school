import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAnnouncement extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  targetAudience: "ALL" | "PARENTS" | "STUDENTS" | "TEACHERS" | "CLASS" | "ACADEMY";
  classId?: mongoose.Types.ObjectId;
  priority: "NORMAL" | "HIGH" | "URGENT";
  publishAt: Date;
  expiresAt?: Date;
  createdBy: mongoose.Types.ObjectId;
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    targetAudience: { type: String, enum: ["ALL", "PARENTS", "STUDENTS", "TEACHERS", "CLASS", "ACADEMY"], required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel" },
    // Blueprint 56: urgency level, and an optional expiry so a stale
    // notice ("PTM this Friday") doesn't keep showing weeks later.
    priority: { type: String, enum: ["NORMAL", "HIGH", "URGENT"], default: "NORMAL" },
    publishAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAnnouncement>("Announcement", announcementSchema);
