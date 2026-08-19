import { Router } from "express";
import { addBook, getBooks, issueBook, returnBook } from "../controllers/libraryController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { LIBRARY_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/books", protect, requireRole(...LIBRARY_STAFF), addBook);
router.get("/books", protect, requireRole(...EVERYONE), getBooks);
router.post("/issue", protect, requireRole(...LIBRARY_STAFF), issueBook);
router.put("/return/:id", protect, requireRole(...LIBRARY_STAFF), returnBook);

export default router;
