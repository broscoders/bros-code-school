import { Router } from "express";
import { getReportCardData, getReportsSummary } from "../controllers/reportsController";

const router = Router();

router.get("/report-card/:studentId", getReportCardData);
router.get("/summary", getReportsSummary);

export default router;
