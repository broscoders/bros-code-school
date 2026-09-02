import { Router } from "express";
import { issueOrGetCard, reissueCard, getCardHistory } from "../controllers/idCardController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ANY_ADMIN_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/issue", protect, requireRole(...ANY_ADMIN_STAFF), issueOrGetCard);
router.post("/reissue", protect, requireRole(...ANY_ADMIN_STAFF), reissueCard);
router.get("/history", protect, requireRole(...ANY_ADMIN_STAFF), getCardHistory);

export default router;
