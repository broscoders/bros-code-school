import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IParent extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  children: mongoose.Types.ObjectId[];
  relationship?: string;
}

const parentSchema = new Schema<IParent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    children: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    relationship: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IParent>("Parent", parentSchema);
