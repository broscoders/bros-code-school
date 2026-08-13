import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IMaintenanceTicket extends Document {
  schoolId: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  assignedTo?: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "REPORTED" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  cost?: number;
  resolutionNotes?: string;
}

const maintenanceTicketSchema = new Schema<IMaintenanceTicket>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    status: { type: String, enum: ["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"], default: "REPORTED" },
    cost: { type: Number },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMaintenanceTicket>("MaintenanceTicket", maintenanceTicketSchema);
