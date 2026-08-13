import { Router } from "express";
import { bulkImportStudents } from "../controllers/bulkController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/students", protect, requireRole("SCHOOL_ADMIN", "PRINCIPAL", "ADMISSION_STAFF"), bulkImportStudents);

export default router;
