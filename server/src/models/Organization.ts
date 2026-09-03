import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type OrganizationType = "SCHOOL" | "ACADEMY" | "COLLEGE" | "INSTITUTE" | "TRAINING_CENTER" | "TUITION_CENTER" | "EDUCATION_NETWORK" | "OTHER";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";

export interface IOrganization extends Document {
  name: string;
  type: OrganizationType;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  address?: string;
  country?: string;
  city?: string;
  logoUrl?: string;
  approxStudents?: number;
  subscriptionStatus: SubscriptionStatus;
  planName: string;
  studentLimit?: number;
  staffLimit?: number;
  branchLimit?: number;
  subscriptionExpiresAt?: Date;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["SCHOOL", "ACADEMY", "COLLEGE", "INSTITUTE", "TRAINING_CENTER", "TUITION_CENTER", "EDUCATION_NETWORK", "OTHER"],
      required: true,
    },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    ownerPhone: { type: String },
    address: { type: String },
    country: { type: String },
    city: { type: String },
    logoUrl: { type: String },
    approxStudents: { type: Number },
    subscriptionStatus: {
      type: String,
      enum: ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED", "EXPIRED"],
      default: "TRIAL",
    },
    planName: { type: String, default: "Trial" },
    studentLimit: { type: Number },
    staffLimit: { type: Number },
    branchLimit: { type: Number, default: 1 },
    // When set and in the past, the org is treated as expired regardless of
    // subscriptionStatus - blueprint requires a grace-period/expiry concept,
    // not just a manually-toggled status.
    subscriptionExpiresAt: { type: Date },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "SUSPENDED", "ARCHIVED"],
      default: "PENDING",
    },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IOrganization>("Organization", organizationSchema);
