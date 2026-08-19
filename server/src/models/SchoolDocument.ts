import mongoose, { Schema } from "mongoose";
import type { Document as MongooseDocument } from "mongoose";

export type DocumentCategory = "STUDENT" | "PARENT" | "TEACHER" | "STAFF" | "SCHOOL" | "CONTRACT" | "CERTIFICATE" | "REPORT";

export interface ISchoolDocument extends MongooseDocument {
  schoolId: mongoose.Types.ObjectId;
  category: DocumentCategory;
  title: string;
  fileUrl: string;
  relatedToId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedByName: string;
  version: number;
  expiryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schoolDocumentSchema = new Schema<ISchoolDocument>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    category: {
      type: String,
      enum: ["STUDENT", "PARENT", "TEACHER", "STAFF", "SCHOOL", "CONTRACT", "CERTIFICATE", "REPORT"],
      required: true,
    },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    relatedToId: { type: Schema.Types.ObjectId },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedByName: { type: String, required: true },
    version: { type: Number, default: 1 },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ISchoolDocument>("SchoolDocument", schoolDocumentSchema);
