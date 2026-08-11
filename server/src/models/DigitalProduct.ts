import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IDigitalProduct extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  subjectName?: string;
  className?: string;
  programId?: mongoose.Types.ObjectId;
  price: number;
  isFree: boolean;
  fileUrl: string;
  status: "ACTIVE" | "INACTIVE";
}

const digitalProductSchema = new Schema<IDigitalProduct>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true },
    description: { type: String },
    subjectName: { type: String },
    className: { type: String },
    programId: { type: Schema.Types.ObjectId, ref: "AcademyProgram" },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    fileUrl: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export default mongoose.model<IDigitalProduct>("DigitalProduct", digitalProductSchema);
