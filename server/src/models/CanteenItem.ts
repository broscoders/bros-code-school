import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ICanteenItem extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  category: "MEAL" | "SNACK" | "BEVERAGE" | "OTHER";
  price: number;
  isAvailable: boolean;
}

const canteenItemSchema = new Schema<ICanteenItem>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ["MEAL", "SNACK", "BEVERAGE", "OTHER"], default: "OTHER" },
    price: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ICanteenItem>("CanteenItem", canteenItemSchema);
