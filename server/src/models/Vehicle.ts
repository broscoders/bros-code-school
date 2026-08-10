import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IVehicle extends Document {
  schoolId: mongoose.Types.ObjectId;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  routeName: string;
  stops: string[];
}

const vehicleSchema = new Schema<IVehicle>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    driverContact: { type: String, required: true },
    routeName: { type: String, required: true },
    stops: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IVehicle>("Vehicle", vehicleSchema);
