import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type PlatformRole = "SUPER_ADMIN" | "SUPPORT_STAFF" | "ACCOUNT_MANAGER";

export interface IPlatformAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: PlatformRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const platformAdminSchema = new Schema<IPlatformAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["SUPER_ADMIN", "SUPPORT_STAFF", "ACCOUNT_MANAGER"], default: "SUPER_ADMIN" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPlatformAdmin>("PlatformAdmin", platformAdminSchema);
