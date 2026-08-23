import mongoose, { Schema, Document } from "mongoose";

export interface ITransportAssignment extends Document {
  schoolId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  monthlyFee: number;
  isActive: boolean;
}

const transportAssignmentSchema = new Schema<ITransportAssignment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    monthlyFee: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITransportAssignment>("TransportAssignment", transportAssignmentSchema);