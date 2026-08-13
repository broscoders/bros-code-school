import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IRefund extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const refundSchema = new Schema<IRefund>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  },
  { timestamps: true }
);

export default mongoose.model<IRefund>("Refund", refundSchema);
