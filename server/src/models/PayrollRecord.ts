import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IPayrollRecord extends Document {
  schoolId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: "PENDING" | "PAID";
  paidDate?: Date;
}

const payrollSchema = new Schema<IPayrollRecord>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "StaffProfile", required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ["PENDING", "PAID"], default: "PENDING" },
    paidDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IPayrollRecord>("PayrollRecord", payrollSchema);
