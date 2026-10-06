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

// Students and parents have no reason to write into school-wide areas such as
// branding or documents; they were allowed into every category.
const LIMITED_ROLE_CATEGORIES = new Set(["general", "homework"]);

// multer only sees the type the browser CLAIMS. Check the file's real first
// bytes too, so a script or executable renamed/labelled as image/png is refused.
function matchesDeclaredType(buf: Buffer, mime: string): boolean {
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => buf[i] === b);
  switch (mime) {
    case "image/jpeg": return startsWith(0xff, 0xd8, 0xff);
    case "image/png": return startsWith(0x89, 0x50, 0x4e, 0x47);
    case "image/gif": return startsWith(0x47, 0x49, 0x46, 0x38);
    case "image/webp": return buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP";
    case "application/pdf": return buf.slice(0, 5).toString() === "%PDF-";
    // modern Office files are zip archives, legacy ones are OLE containers
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return startsWith(0x50, 0x4b, 0x03, 0x04);
    case "application/msword":
    case "application/vnd.ms-excel":
    case "application/vnd.ms-powerpoint":
      return startsWith(0xd0, 0xcf, 0x11, 0xe0);
    default: return false;
  }
}

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

    if (!matchesDeclaredType(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ message: "This file's contents do not match its type. Please upload a genuine PDF, image or Office document." });
    }

    const category = resolveCategory(req.body.folder);
    if (["STUDENT", "PARENT"].includes(req.user!.role) && !LIMITED_ROLE_CATEGORIES.has(category)) {
      return res.status(403).json({ message: "You are not allowed to upload to this area" });
    }
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
