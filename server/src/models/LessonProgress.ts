import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ILessonProgress extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  lessonId: mongoose.Types.ObjectId;
  status: "IN_PROGRESS" | "COMPLETED";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lessonProgressSchema = new Schema<ILessonProgress>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    status: { type: String, enum: ["IN_PROGRESS", "COMPLETED"], default: "IN_PROGRESS" },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

lessonProgressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

export default mongoose.model<ILessonProgress>("LessonProgress", lessonProgressSchema);
