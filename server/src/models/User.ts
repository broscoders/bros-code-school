import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type UserRole =
  | "SCHOOL_ADMIN"
  | "PRINCIPAL"
  | "HEAD"
  | "ADMISSION_STAFF"
  | "ACADEMIC_COORDINATOR"
  | "ACCOUNTANT"
  | "RECEPTIONIST"
  | "LIBRARIAN"
  | "TRANSPORT_MANAGER"
  | "NURSE"
  | "HOSTEL_WARDEN"
  | "TEACHER"
  | "ACADEMY_TEACHER"
  | "PARENT"
  | "STUDENT";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  schoolId: mongoose.Types.ObjectId;
  isActive: boolean;
  accountStatus: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  accountStatusReason?: string;
  isEmailVerified: boolean;
  mustChangePassword: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  passwordResetCode?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    isActive: { type: Boolean, default: true },
    // Blueprint 11 (Account States): the login-gating status for this
    // account, independent of any business-lifecycle status (e.g. a
    // Teacher's employmentStatus or a Student's status field). Those
    // lifecycle updates sync into this field (see utils/accountSync.ts)
    // so leaving staff/students can no longer log in, without deleting
    // any of their history.
    accountStatus: { type: String, enum: ["ACTIVE", "SUSPENDED", "ARCHIVED"], default: "ACTIVE" },
    accountStatusReason: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    mustChangePassword: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeExpires: { type: Date, select: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    passwordResetCode: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
