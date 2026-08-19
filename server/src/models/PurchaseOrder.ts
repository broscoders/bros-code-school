import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IPurchaseOrderItem {
  itemName: string;
  quantity: number;
  estimatedCost: number;
}

export interface IPurchaseOrder extends Document {
  schoolId: mongoose.Types.ObjectId;
  vendorId?: mongoose.Types.ObjectId;
  items: IPurchaseOrderItem[];
  totalEstimatedCost: number;
  requestedBy: mongoose.Types.ObjectId;
  requestedByName: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "ORDERED" | "RECEIVED";
  approvedBy?: mongoose.Types.ObjectId;
  receivedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderItemSchema = new Schema<IPurchaseOrderItem>(
  {
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    estimatedCost: { type: Number, required: true },
  },
  { _id: false }
);

const purchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor" },
    items: { type: [purchaseOrderItemSchema], required: true },
    totalEstimatedCost: { type: Number, required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedByName: { type: String, required: true },
    status: { type: String, enum: ["REQUESTED", "APPROVED", "REJECTED", "ORDERED", "RECEIVED"], default: "REQUESTED" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    receivedDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IPurchaseOrder>("PurchaseOrder", purchaseOrderSchema);
