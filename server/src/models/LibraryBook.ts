import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export interface ILibraryBook extends Document {
  schoolId: mongoose.Types.ObjectId;
  title: string;
  author?: string;
  category?: string;
  totalCopies: number;
  availableCopies: number;
}

const libraryBookSchema = new Schema<ILibraryBook>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true },
    author: { type: String },
    category: { type: String },
    totalCopies: { type: Number, default: 1 },
    availableCopies: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model<ILibraryBook>("LibraryBook", libraryBookSchema);
