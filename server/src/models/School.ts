import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ISchool extends Document {
  organizationId?: mongoose.Types.ObjectId;
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const schoolSchema = new Schema<ISchool>(
  {
    // Not required at the DB level so existing schools created before this field
    // existed still load fine. New schools created through the organization
    // onboarding flow always set this.
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    name: { type: String, required: true },
    logoUrl: { type: String },
    primaryColor: { type: String, default: "#1E3A8A" },
    secondaryColor: { type: String, default: "#F59E0B" },
    address: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ISchool>("School", schoolSchema);
