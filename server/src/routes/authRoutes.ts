import { Router } from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  verifyEmail,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { protect, requireRole } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationCode);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.post(
  "/register",
  protect,
  requireRole("SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ADMISSION_STAFF"),
  registerUser
);

export default router;