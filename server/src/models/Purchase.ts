import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IPurchase extends Document {
  schoolId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: "RECORDED" | "VERIFIED";
  purchasedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "DigitalProduct", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    status: { type: String, enum: ["RECORDED", "VERIFIED"], default: "RECORDED" },
    purchasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
purchaseSchema.index({ schoolId: 1 });

export default mongoose.model<IPurchase>("Purchase", purchaseSchema);
