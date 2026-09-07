import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IStaffLoan extends Document {
  schoolId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  amount: number;
  reason: string;
  monthlyDeduction: number;
  remainingBalance: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
}

const staffLoanSchema = new Schema<IStaffLoan>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "StaffProfile", required: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    monthlyDeduction: { type: Number, required: true },
    remainingBalance: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"], default: "PENDING" },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IStaffLoan>("StaffLoan", staffLoanSchema);
