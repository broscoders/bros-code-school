import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ICanteenOrderLine {
  itemId: mongoose.Types.ObjectId;
  itemName: string;
  price: number;
  quantity: number;
}

export interface ICanteenOrder extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  items: ICanteenOrderLine[];
  totalAmount: number;
  status: "PLACED" | "PREPARING" | "READY" | "COLLECTED" | "CANCELLED";
  orderDate: Date;
}

const canteenOrderLineSchema = new Schema<ICanteenOrderLine>(
  { itemId: { type: Schema.Types.ObjectId, ref: "CanteenItem", required: true }, itemName: { type: String, required: true }, price: { type: Number, required: true }, quantity: { type: Number, required: true } },
  { _id: false }
);

const canteenOrderSchema = new Schema<ICanteenOrder>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    items: { type: [canteenOrderLineSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ["PLACED", "PREPARING", "READY", "COLLECTED", "CANCELLED"], default: "PLACED" },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<ICanteenOrder>("CanteenOrder", canteenOrderSchema);
