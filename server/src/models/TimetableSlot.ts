import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

export interface ITimetableSlot extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  dayOfWeek: DayOfWeek;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId?: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  room?: string;
  isBreak: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const timetableSlotSchema = new Schema<ITimetableSlot>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    dayOfWeek: {
      type: String,
      enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      required: true,
    },
    periodNumber: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher" },
    room: { type: String },
    isBreak: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One slot per section/day/period - this is what makes "upsert" safe and prevents
// the same section from accidentally getting two different subjects at once.
timetableSlotSchema.index({ sectionId: 1, dayOfWeek: 1, periodNumber: 1 }, { unique: true });

export default mongoose.model<ITimetableSlot>("TimetableSlot", timetableSlotSchema);
