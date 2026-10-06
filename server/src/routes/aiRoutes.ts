import { Router } from "express";
import { chatWithAI } from "../controllers/aiController";
import { protect } from "../middleware/authMiddleware";
import { aiLimiter } from "../middleware/rateLimiters";

const router = Router();

router.post("/chat", protect, aiLimiter, chatWithAI);

export default router;
