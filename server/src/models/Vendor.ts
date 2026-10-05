import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IVendor extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  contact: string;
  category?: string;
}

const vendorSchema = new Schema<IVendor>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    category: { type: String },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
vendorSchema.index({ schoolId: 1 });

export default mongoose.model<IVendor>("Vendor", vendorSchema);
