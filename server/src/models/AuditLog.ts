import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IAuditLog extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  action: string;
  recordType: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    recordType: { type: String, required: true },
    recordId: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
auditLogSchema.index({ schoolId: 1 });
auditLogSchema.index({ schoolId: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
