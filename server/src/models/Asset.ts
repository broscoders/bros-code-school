import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAsset extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  location?: string;
  assignedTo?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  condition: "GOOD" | "FAIR" | "NEEDS_REPAIR" | "DAMAGED";
  assetTag: string;
}

const assetSchema = new Schema<IAsset>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    location: { type: String },
    assignedTo: { type: String },
    purchaseDate: { type: Date },
    warrantyExpiry: { type: Date },
    condition: { type: String, enum: ["GOOD", "FAIR", "NEEDS_REPAIR", "DAMAGED"], default: "GOOD" },
    assetTag: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IAsset>("Asset", assetSchema);
