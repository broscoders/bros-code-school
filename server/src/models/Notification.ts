import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface INotification extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  category: "ACADEMIC" | "FINANCE" | "ATTENDANCE" | "ADMISSION" | "SYSTEM" | "COMMUNICATION";
  isRead: boolean;
}

const notificationSchema = new Schema<INotification>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    category: { type: String, enum: ["ACADEMIC", "FINANCE", "ATTENDANCE", "ADMISSION", "SYSTEM", "COMMUNICATION"], default: "SYSTEM" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>("Notification", notificationSchema);
