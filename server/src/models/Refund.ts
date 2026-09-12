import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IRefund extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedByUserId?: mongoose.Types.ObjectId;
}

const refundSchema = new Schema<IRefund>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    // Blueprint 98 (Approval Workflows): whoever requested the refund
    // shouldn't also be the one approving it - see the self-approval
    // guard in updateRefundStatus.
    requestedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IRefund>("Refund", refundSchema);
