import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

// The client only ever picks a logical category, never a raw path - the
// actual Cloudinary folder is built here, server-side, and namespaced by the
// caller's own schoolId. Without this, a client-supplied folder string (as
// this endpoint originally accepted) would let any authenticated user -
// including a parent or student - write into an arbitrary Cloudinary path,
// with no restriction tying uploads to their own school or role.
const ALLOWED_CATEGORIES = new Set([
  "general",
  "documents",
  "homework",
  "branding",
  "lms",
  "study-material",
  "notes-store",
]);

function resolveCategory(rawFolder: unknown): string {
  if (typeof rawFolder !== "string") return "general";
  const lastSegment = rawFolder.split("/").pop() || "general";
  return ALLOWED_CATEGORIES.has(lastSegment) ? lastSegment : "general";
}

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const category = resolveCategory(req.body.folder);
    const folder = `bros-code-school/${req.user!.schoolId}/${category}`;

    const streamUpload = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "auto" }, (error, result) => {
          if (result) resolve(result);
          else reject(error);
        });
        streamifier.createReadStream(req.file!.buffer).pipe(stream);
      });

    const result: any = await streamUpload();
    res.status(201).json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: (err as Error).message });
  }
};
