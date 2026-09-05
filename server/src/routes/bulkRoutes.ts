import { Router } from "express";
import { bulkImportStudents, bulkImportTeachers } from "../controllers/bulkController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/students", protect, requireRole("SCHOOL_ADMIN", "PRINCIPAL", "ADMISSION_STAFF"), bulkImportStudents);
router.post("/teachers", protect, requireRole("SCHOOL_ADMIN", "PRINCIPAL"), bulkImportTeachers);

export default router;
