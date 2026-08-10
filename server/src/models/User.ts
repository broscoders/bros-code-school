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
        "TEACHER",
        "ACADEMY_TEACHER",
        "PARENT",
        "STUDENT",
      ],
      required: true,
    },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);