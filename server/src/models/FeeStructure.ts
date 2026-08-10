import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IFeeStructure extends Document {
  schoolId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  feeType: string;
  amount: number;
  frequency: "MONTHLY" | "ONE_TIME" | "ANNUAL";
}

const feeStructureSchema = new Schema<IFeeStructure>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    feeType: { type: String, required: true },
    amount: { type: Number, required: true },
    frequency: { type: String, enum: ["MONTHLY", "ONE_TIME", "ANNUAL"], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IFeeStructure>("FeeStructure", feeStructureSchema);
