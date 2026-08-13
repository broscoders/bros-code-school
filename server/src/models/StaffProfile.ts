import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IStaffProfile extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  departmentId?: mongoose.Types.ObjectId;
  designation: string;
  joiningDate: Date;
  employmentStatus: "ACTIVE" | "ON_LEAVE" | "TERMINATED";
  basicSalary: number;
}

const staffProfileSchema = new Schema<IStaffProfile>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: { type: String, required: true },
    departmentId: { type: Schema.Types.ObjectId, ref: "Department" },
    designation: { type: String, required: true },
    joiningDate: { type: Date, default: Date.now },
    employmentStatus: { type: String, enum: ["ACTIVE", "ON_LEAVE", "TERMINATED"], default: "ACTIVE" },
    basicSalary: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IStaffProfile>("StaffProfile", staffProfileSchema);
