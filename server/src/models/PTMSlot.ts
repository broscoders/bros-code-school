import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IPTMSlot extends Document {
  schoolId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  parentId?: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  isBooked: boolean;
}

const ptmSlotSchema = new Schema<IPTMSlot>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Parent" },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" },
    isBooked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPTMSlot>("PTMSlot", ptmSlotSchema);
