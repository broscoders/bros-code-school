import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

// Blueprint 36/85 (Fee Management, online payments): a full record of
// every JazzCash attempt, kept independently of the Invoice itself so a
// failed/pending transaction is never silently lost, and so support can
// answer "what actually happened to this payment" without needing
// JazzCash's own merchant portal.
export type JazzCashTxnStatus = "INITIATED" | "SUCCESS" | "FAILED" | "PENDING";

export interface IJazzCashTransaction extends Document {
  schoolId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  initiatedByUserId: mongoose.Types.ObjectId;
  txnRefNo: string;
  amount: number;
  mobileNumber: string;
  status: JazzCashTxnStatus;
  responseCode?: string;
  responseMessage?: string;
  jazzcashTxnId?: string;
  rawResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jazzCashTransactionSchema = new Schema<IJazzCashTransaction>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    initiatedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    txnRefNo: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    mobileNumber: { type: String, required: true },
    status: { type: String, enum: ["INITIATED", "SUCCESS", "FAILED", "PENDING"], default: "INITIATED" },
    responseCode: { type: String },
    responseMessage: { type: String },
    jazzcashTxnId: { type: String },
    rawResponse: { type: String },
  },
  { timestamps: true }
);

jazzCashTransactionSchema.index({ invoiceId: 1, createdAt: -1 });

export default mongoose.model<IJazzCashTransaction>("JazzCashTransaction", jazzCashTransactionSchema);
