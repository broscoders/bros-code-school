import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

// Blueprint 70 + 71 (Email/SMS/WhatsApp/Push, Delivery Status): every
// outbound email now leaves a record here instead of the previous
// behavior, which was either an uncaught throw (crashing whatever
// triggered it) or a bare `.catch(() => {})` that swallowed failures with
// no trace at all - meaning "did the parent actually get this email?"
// had no answer beyond checking server logs, if those were even kept.
export type CommunicationStatus = "SENT" | "FAILED";
export type CommunicationChannel = "EMAIL" | "SMS" | "WHATSAPP";

export interface ICommunicationLog extends Document {
  schoolId?: mongoose.Types.ObjectId;
  channel: CommunicationChannel;
  to: string;
  subject: string;
  status: CommunicationStatus;
  error?: string;
  createdAt: Date;
}

const communicationLogSchema = new Schema<ICommunicationLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School" },
    channel: { type: String, enum: ["EMAIL", "SMS", "WHATSAPP"], default: "EMAIL" },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["SENT", "FAILED"], required: true },
    error: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

communicationLogSchema.index({ schoolId: 1, createdAt: -1 });

export default mongoose.model<ICommunicationLog>("CommunicationLog", communicationLogSchema);
