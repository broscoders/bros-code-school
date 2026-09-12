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
  getMySessions,
  revokeSession,
  logoutOtherSessions,
  logout,
  setupTwoFactor,
  verifyTwoFactorSetup,
  disableTwoFactor,
  verifyTwoFactorLogin,
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
router.post("/logout", protect, logout);
router.get("/sessions", protect, getMySessions);
router.post("/sessions/:id/revoke", protect, revokeSession);
router.post("/sessions/logout-others", protect, logoutOtherSessions);

router.post("/2fa/setup", protect, setupTwoFactor);
router.post("/2fa/verify-setup", protect, verifyTwoFactorSetup);
router.post("/2fa/disable", protect, disableTwoFactor);
router.post("/2fa/verify-login", loginLimiter, verifyTwoFactorLogin);

router.post(
  "/register",
  protect,
  requireRole("SCHOOL_ADMIN", "PRINCIPAL", "HEAD", "ADMISSION_STAFF"),
  registerUser
);

export default router;