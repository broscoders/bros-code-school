import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ISection extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  name: string;
  capacity?: number;
}

const sectionSchema = new Schema<ISection>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    name: { type: String, required: true },
    capacity: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<ISection>("Section", sectionSchema);
