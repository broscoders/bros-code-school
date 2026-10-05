import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ILibraryTransaction extends Document {
  schoolId: mongoose.Types.ObjectId;
  bookId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: "ISSUED" | "RETURNED" | "OVERDUE";
}

const libraryTransactionSchema = new Schema<ILibraryTransaction>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    bookId: { type: Schema.Types.ObjectId, ref: "LibraryBook", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: { type: String, enum: ["ISSUED", "RETURNED", "OVERDUE"], default: "ISSUED" },
  },
  { timestamps: true }
);

// Performance: speeds up the most common lookups (every list/detail screen filters by these).
libraryTransactionSchema.index({ schoolId: 1 });

export default mongoose.model<ILibraryTransaction>("LibraryTransaction", libraryTransactionSchema);
