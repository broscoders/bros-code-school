import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IVehicle extends Document {
  schoolId: mongoose.Types.ObjectId;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  routeName: string;
  stops: string[];
  // Blueprint 49 (Transport): capacity/occupied mirror the same
  // atomic-reservation pattern as HostelRoom, so two simultaneous
  // assignments can't over-fill a vehicle past its physical seating.
  capacity: number;
  occupied: number;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
}

const vehicleSchema = new Schema<IVehicle>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverContact: { type: String, required: true },
    routeName: { type: String, required: true },
    stops: [{ type: String }],
    capacity: { type: Number, required: true, default: 40 },
    occupied: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "MAINTENANCE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export default mongoose.model<IVehicle>("Vehicle", vehicleSchema);
