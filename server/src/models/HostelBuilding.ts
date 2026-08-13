import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IHostelBuilding extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  type: "BOYS" | "GIRLS";
  wardenName?: string;
}

const hostelBuildingSchema = new Schema<IHostelBuilding>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["BOYS", "GIRLS"], required: true },
    wardenName: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IHostelBuilding>("HostelBuilding", hostelBuildingSchema);
