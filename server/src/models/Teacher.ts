import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ITeacher extends Document {
  schoolId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  qualification?: string;
  subjects: mongoose.Types.ObjectId[];
  assignedClasses: mongoose.Types.ObjectId[];
}

const teacherSchema = new Schema<ITeacher>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    employeeId: { type: String, required: true },
    qualification: { type: String },
    subjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    assignedClasses: [{ type: Schema.Types.ObjectId, ref: "ClassModel" }],
  },
  { timestamps: true }
);

export default mongoose.model<ITeacher>("Teacher", teacherSchema);
