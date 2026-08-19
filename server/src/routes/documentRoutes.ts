import { Router } from "express";
import { uploadDocument, getDocuments, getMyDocuments, getExpiringDocuments, deleteDocument } from "../controllers/documentController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ANY_ADMIN_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...ANY_ADMIN_STAFF), uploadDocument);
router.get("/", protect, requireRole(...ANY_ADMIN_STAFF), getDocuments);
router.get("/mine", protect, requireRole(...EVERYONE), getMyDocuments);
router.get("/expiring", protect, requireRole(...ANY_ADMIN_STAFF), getExpiringDocuments);
router.delete("/:id", protect, requireRole(...ANY_ADMIN_STAFF), deleteDocument);

export default router;
