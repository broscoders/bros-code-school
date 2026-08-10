import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface IMessage extends Document {
  schoolId: mongoose.Types.ObjectId;
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  content: string;
  status: "NEW" | "PENDING" | "REPLIED" | "ARCHIVED";
}

const messageSchema = new Schema<IMessage>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student" },
    content: { type: String, required: true },
    status: { type: String, enum: ["NEW", "PENDING", "REPLIED", "ARCHIVED"], default: "NEW" },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", messageSchema);
