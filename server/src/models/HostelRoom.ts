import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IHostelRoom extends Document {
  schoolId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  roomNumber: string;
  capacity: number;
  occupied: number;
}

const hostelRoomSchema = new Schema<IHostelRoom>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    buildingId: { type: Schema.Types.ObjectId, ref: "HostelBuilding", required: true },
    roomNumber: { type: String, required: true },
    capacity: { type: Number, required: true },
    occupied: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
hostelRoomSchema.index({ schoolId: 1 });

export default mongoose.model<IHostelRoom>("HostelRoom", hostelRoomSchema);
