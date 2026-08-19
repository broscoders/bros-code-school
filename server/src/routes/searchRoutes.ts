import { Router } from "express";
import { globalSearch } from "../controllers/searchController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { EVERYONE } from "../middleware/permissions";

const router = Router();

router.get("/", protect, requireRole(...EVERYONE), globalSearch);

export default router;
