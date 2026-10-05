import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IEvent extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  eventType: "HOLIDAY" | "EXAM" | "PTM" | "SPORTS" | "TRIP" | "COMPETITION" | "FUNCTION" | "WORKSHOP" | "ACADEMY";
  date: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true },
    description: { type: String },
    eventType: { type: String, enum: ["HOLIDAY", "EXAM", "PTM", "SPORTS", "TRIP", "COMPETITION", "FUNCTION", "WORKSHOP", "ACADEMY"], required: true },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
eventSchema.index({ schoolId: 1 });

export default mongoose.model<IEvent>("Event", eventSchema);
