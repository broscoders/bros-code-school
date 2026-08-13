import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IVisitor extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  contact: string;
  purpose: string;
  personToMeet: string;
  checkInTime: Date;
  checkOutTime?: Date;
  status: "CHECKED_IN" | "CHECKED_OUT";
}

const visitorSchema = new Schema<IVisitor>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    purpose: { type: String, required: true },
    personToMeet: { type: String, required: true },
    checkInTime: { type: Date, default: Date.now },
    checkOutTime: { type: Date },
    status: { type: String, enum: ["CHECKED_IN", "CHECKED_OUT"], default: "CHECKED_IN" },
  },
  { timestamps: true }
);

export default mongoose.model<IVisitor>("Visitor", visitorSchema);
