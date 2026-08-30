import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { uploadFile } from "../controllers/uploadController";
import { upload } from "../middleware/upload";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// multer's fileFilter/size-limit errors are passed to next(err) rather than
// thrown, so without this wrapper a rejected file falls through to Express's
// default error handler (a bare 500) instead of a clean, expected 400.
function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single("file")(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      return res.status(400).json({ message });
    }
    next();
  });
}

router.post("/", protect, handleUpload, uploadFile);

export default router;
