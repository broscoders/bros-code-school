import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type StudentStatus = "ACTIVE" | "ON_LEAVE" | "SUSPENDED" | "TRANSFERRED" | "WITHDRAWN" | "GRADUATED" | "ALUMNI" | "ARCHIVED";

export interface IClassTransferRecord {
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  fromDate: Date;
  toDate?: Date;
}

export interface ISchoolTransferRecord {
  schoolId: mongoose.Types.ObjectId;
  fromDate: Date;
  toDate?: Date;
}

export interface IStudent extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  admissionNumber: string;
  classId: mongoose.Types.ObjectId;
  sectionId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  admissionDate: Date;
  status: StudentStatus;
  statusReason?: string;
  statusChangedAt?: Date;
  classHistory: IClassTransferRecord[];
  // Preserves which branch/school a student was previously enrolled at,
  // the same way classHistory preserves past class/section - blueprint
  // edge case "Student changes campus/school" must never overwrite this.
  schoolHistory: ISchoolTransferRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const classTransferRecordSchema = new Schema<IClassTransferRecord>(
  {
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date },
  },
  { _id: false }
);

const schoolTransferRecordSchema = new Schema<ISchoolTransferRecord>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date },
  },
  { _id: false }
);

const studentSchema = new Schema<IStudent>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    admissionNumber: { type: String, required: true },
    classId: { type: Schema.Types.ObjectId, ref: "ClassModel", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Parent" },
    dateOfBirth: { type: Date },
    gender: { type: String },
    address: { type: String },
    admissionDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TRANSFERRED", "WITHDRAWN", "GRADUATED", "ALUMNI", "ARCHIVED"],
      default: "ACTIVE",
    },
    statusReason: { type: String },
    statusChangedAt: { type: Date },
    classHistory: { type: [classTransferRecordSchema], default: [] },
    schoolHistory: { type: [schoolTransferRecordSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IStudent>("Student", studentSchema);
