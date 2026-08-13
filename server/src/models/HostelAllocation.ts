import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IHostelAllocation extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  allocationDate: Date;
  isActive: boolean;
  monthlyFee: number;
}

const hostelAllocationSchema = new Schema<IHostelAllocation>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "HostelRoom", required: true },
    allocationDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    monthlyFee: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IHostelAllocation>("HostelAllocation", hostelAllocationSchema);
