import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type LessonContentType = "VIDEO" | "PDF" | "TEXT" | "LINK";

export interface ILesson extends Document {
  schoolId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  contentType: LessonContentType;
  contentUrl?: string;
  textContent?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    contentType: { type: String, enum: ["VIDEO", "PDF", "TEXT", "LINK"], required: true },
    contentUrl: { type: String },
    textContent: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ILesson>("Lesson", lessonSchema);
