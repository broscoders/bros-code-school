import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type TopicStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface ICurriculumTopic extends Document {
  schoolId: mongoose.Types.ObjectId;
  academicSessionId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  chapterName: string;
  topicName: string;
  order: number;
  status: TopicStatus;
  teacherNotes?: string;
  completedAt?: Date;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const curriculumTopicSchema = new Schema<ICurriculumTopic>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: "AcademicSession", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    chapterName: { type: String, required: true },
    topicName: { type: String, required: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"], default: "NOT_STARTED" },
    teacherNotes: { type: String },
    completedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

curriculumTopicSchema.index({ schoolId: 1, academicSessionId: 1, classId: 1, subjectId: 1 });

export default mongoose.model<ICurriculumTopic>("CurriculumTopic", curriculumTopicSchema);
