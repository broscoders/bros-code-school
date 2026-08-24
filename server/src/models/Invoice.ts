import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IInvoice extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  feeType: string;
  amount: number;
  dueDate: Date;
  status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  paidDate?: Date;
  paidAmount?: number;
  originalAmount?: number;
  discountApplied?: mongoose.Types.ObjectId;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    feeType: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"], default: "PENDING" },
    paidDate: { type: Date },
    paidAmount: { type: Number },
    originalAmount: { type: Number },
    discountApplied: { type: Schema.Types.ObjectId, ref: "Discount" },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>("Invoice", invoiceSchema);
