import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ILead extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  contact: string;
  source?: string;
  interestedIn?: string;
  status: "NEW" | "CONTACTED" | "DEMO_SCHEDULED" | "CONVERTED" | "LOST";
  assignedTo?: mongoose.Types.ObjectId;
  notes?: string;
  followUpDate?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    source: { type: String },
    interestedIn: { type: String },
    status: { type: String, enum: ["NEW", "CONTACTED", "DEMO_SCHEDULED", "CONVERTED", "LOST"], default: "NEW" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ILead>("Lead", leadSchema);
