import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import cloudinary from "../config/cloudinary";
import streamifier from "streamifier";

export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const folder = req.body.folder || "bros-code-school/general";

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
