import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IInvoice extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  feeType: string;
  amount: number;
  dueDate: Date;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidDate?: Date;
  paidAmount?: number;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    feeType: { type: String, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["PENDING", "PAID", "OVERDUE"], default: "PENDING" },
    paidDate: { type: Date },
    paidAmount: { type: Number },
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>("Invoice", invoiceSchema);
