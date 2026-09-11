import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";
import type { UserRole } from "./User";

// Blueprint 9 (Account Invitations): admins invite teachers/staff/parents/
// students by email instead of the school having to hand out a password
// directly. Until now, account creation only supported registerUser
// (admin picks a temp password on the person's behalf) - this model adds
// the proper invite-link flow: pending -> accepted / expired / revoked.
export type InvitationStatus = "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";

export interface IInvitation extends Document {
  schoolId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  token: string;
  status: InvitationStatus;
  invitedByUserId: mongoose.Types.ObjectId;
  invitedByName: string;
  expiresAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
  // Optional linking metadata so, once accepted, the frontend can finish
  // wiring the new User up to a Teacher/Parent/Student profile record
  // (e.g. which children a parent invite is for) without a separate lookup.
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: [
        "SCHOOL_ADMIN",
        "PRINCIPAL",
        "HEAD",
        "ADMISSION_STAFF",
        "ACADEMIC_COORDINATOR",
        "ACCOUNTANT",
        "RECEPTIONIST",
        "LIBRARIAN",
        "TRANSPORT_MANAGER",
        "NURSE",
        "HOSTEL_WARDEN",
        "TEACHER",
        "ACADEMY_TEACHER",
        "PARENT",
        "STUDENT",
      ],
      required: true,
    },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"], default: "PENDING" },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    invitedByName: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date },
    revokedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// One school shouldn't accumulate multiple live invitations for the same
// email - createInvitation reuses/refreshes the pending one instead.
invitationSchema.index({ schoolId: 1, email: 1, status: 1 });

export default mongoose.model<IInvitation>("Invitation", invitationSchema);
