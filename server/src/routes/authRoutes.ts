import { Router } from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  verifyEmail,
  resendVerificationCode,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { loginLimiter, emailActionLimiter } from "../middleware/rateLimiters";

const router = Router();

router.post("/login", loginLimiter, loginUser);
router.post("/google", loginLimiter, googleLogin);
router.post("/verify-email", emailActionLimiter, verifyEmail);
router.post("/resend-verification", emailActionLimiter, resendVerificationCode);
router.post("/forgot-password", emailActionLimiter, forgotPassword);
router.post("/reset-password", emailActionLimiter, resetPassword);
router.put("/change-password", protect, changePassword);

router.post(
  "/register",
  protect,
  requireRole("SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ADMISSION_STAFF"),
  registerUser
);

export default router;