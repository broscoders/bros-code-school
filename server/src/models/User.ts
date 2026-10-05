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
  phone?: string;
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
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Blueprint 23/70: needed to actually send SMS/WhatsApp notifications
    // and now collected on the Student/Teacher/Parent/Staff creation
    // forms, plus self-service editable via My Profile.
    phone: { type: String },
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
    // Blueprint 73 (Security): TOTP-based two-factor auth. Secret and
    // backup codes are select:false so a normal User.find() never
    // accidentally leaks them - they're only pulled in explicitly by the
    // 2FA controller functions that need them.
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false },
  },
  { timestamps: true }
);

// SECURITY: the bcrypt password hash must never reach a browser. `password`
// is not `select: false` (login/change-password read it from the document),
// and 49 places populate the user into students/teachers/parents/staff/leave/
// loans/payroll responses - so every one of those used to send each person's
// password hash to whoever opened the list (teachers included). Stripping it
// from serialisation fixes all of them at once without touching the login code.
const stripSecrets = (_doc: unknown, ret: any) => {
  delete ret.password;
  delete ret.twoFactorSecret;
  delete ret.twoFactorBackupCodes;
  delete ret.verificationCode;
  delete ret.passwordResetCode;
  return ret;
};
userSchema.set("toJSON", { transform: stripSecrets });
userSchema.set("toObject", { transform: stripSecrets });

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
userSchema.index({ schoolId: 1 });
userSchema.index({ schoolId: 1, role: 1 });

export default mongoose.model<IUser>("User", userSchema);
