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

export default mongoose.model<IVendor>("Vendor", vendorSchema);
