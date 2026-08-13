import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IExpense extends Document {
  schoolId: mongoose.Types.ObjectId;
  category: string;
  description: string;
  amount: number;
  vendor?: string;
  date: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    vendor: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>("Expense", expenseSchema);
