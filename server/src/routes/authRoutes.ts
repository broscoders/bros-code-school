import { Router } from "express";
import { registerUser, loginUser } from "../controllers/authController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", loginUser);
router.post(
  "/register",
  protect,
  requireRole("SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ADMISSION_STAFF"),
  registerUser
);

export default router;
