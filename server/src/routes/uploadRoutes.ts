import { Router } from "express";
import { uploadFile } from "../controllers/uploadController";
import { upload } from "../middleware/upload";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, upload.single("file"), uploadFile);

export default router;
