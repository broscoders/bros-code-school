import { Router } from "express";
import { getReportCardData, getReportsSummary } from "../controllers/reportsController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { EVERYONE, ANY_ADMIN_STAFF } from "../middleware/permissions";

const router = Router();

router.get("/report-card/:studentId", protect, requireRole(...EVERYONE), getReportCardData);
router.get("/summary", protect, requireRole(...ANY_ADMIN_STAFF), getReportsSummary);

export default router;
