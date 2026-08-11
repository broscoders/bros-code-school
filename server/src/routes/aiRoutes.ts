import { Router } from "express";
import { chatWithAI } from "../controllers/aiController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/chat", protect, chatWithAI);

export default router;
