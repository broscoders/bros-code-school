import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IDepartment extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
}

const departmentSchema = new Schema<IDepartment>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDepartment>("Department", departmentSchema);
