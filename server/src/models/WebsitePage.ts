import mongoose, { Schema } from "mongoose";
import type { Document } from "mongoose";

export type WebsitePageType = "HOME" | "ABOUT" | "ADMISSIONS" | "EVENTS" | "GALLERY" | "CONTACT" | "FAQ";

export interface IWebsiteSection {
  heading?: string;
  body?: string;
  imageUrl?: string;
  order: number;
}

export interface IWebsitePage extends Document {
  schoolId: mongoose.Types.ObjectId;
  pageType: WebsitePageType;
  title: string;
  sections: IWebsiteSection[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: Date;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const websiteSectionSchema = new Schema<IWebsiteSection>(
  {
    heading: { type: String },
    body: { type: String },
    imageUrl: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const websitePageSchema = new Schema<IWebsitePage>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    pageType: { type: String, enum: ["HOME", "ABOUT", "ADMISSIONS", "EVENTS", "GALLERY", "CONTACT", "FAQ"], required: true },
    title: { type: String, required: true },
    sections: { type: [websiteSectionSchema], default: [] },
    // Draft/Review/Publish workflow (blueprint 78): only PUBLISHED pages are
    // returned by the public site endpoint. A DRAFT page (or a published
    // page that's mid-edit) is only visible to school staff via the admin
    // CMS endpoints.
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT" },
    publishedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One page per type per school.
websitePageSchema.index({ schoolId: 1, pageType: 1 }, { unique: true });

export default mongoose.model<IWebsitePage>("WebsitePage", websitePageSchema);
