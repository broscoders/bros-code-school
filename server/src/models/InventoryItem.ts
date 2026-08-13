import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IInventoryItem extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  warehouse?: string;
  quantity: number;
  lowStockThreshold: number;
  unit: string;
}

const inventoryItemSchema = new Schema<IInventoryItem>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    warehouse: { type: String },
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    unit: { type: String, default: "pcs" },
  },
  { timestamps: true }
);

export default mongoose.model<IInventoryItem>("InventoryItem", inventoryItemSchema);
