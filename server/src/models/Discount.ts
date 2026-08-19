import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IDiscount extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: "DISCOUNT" | "SCHOLARSHIP";
  reason: string;
  percentage?: number;
  fixedAmount?: number;
  isActive: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: mongoose.Types.ObjectId;
}

const discountSchema = new Schema<IDiscount>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    type: { type: String, enum: ["DISCOUNT", "SCHOLARSHIP"], required: true },
    reason: { type: String, required: true },
    percentage: { type: Number },
    fixedAmount: { type: Number },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IDiscount>("Discount", discountSchema);
