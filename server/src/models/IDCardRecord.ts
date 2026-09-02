import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type IDCardPersonType = "STUDENT" | "TEACHER" | "STAFF";

export interface IIDCardRecord extends Document {
  schoolId: mongoose.Types.ObjectId;
  personType: IDCardPersonType;
  personId: mongoose.Types.ObjectId;
  cardNumber: string;
  issueDate: Date;
  issuedBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
}

const idCardRecordSchema = new Schema<IIDCardRecord>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    personType: { type: String, enum: ["STUDENT", "TEACHER", "STAFF"], required: true },
    personId: { type: Schema.Types.ObjectId, required: true },
    // Blueprint 63: every official ID/certificate needs a unique number,
    // issue date, and a record in the person's history - none of which
    // existed before (the old ID Cards page just rendered a printable
    // card with no backing record at all).
    cardNumber: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // A reissued card (lost/damaged) deactivates the old record rather than
    // deleting it, so history is preserved (blueprint: never destroy the
    // history of an official document).
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

idCardRecordSchema.index({ schoolId: 1, personType: 1, personId: 1 });

export default mongoose.model<IIDCardRecord>("IDCardRecord", idCardRecordSchema);
