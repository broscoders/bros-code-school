import { Router } from "express";
import {
  createInvitation,
  getInvitations,
  resendInvitation,
  revokeInvitation,
  getInvitationByToken,
  acceptInvitation,
} from "../controllers/invitationController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/checkPermission";
import { ANY_ADMIN_STAFF } from "../middleware/permissions";
import { emailActionLimiter, bulkEmailActionLimiter } from "../middleware/rateLimiters";

const router = Router();

// Public: the invite link and the accept form both need to work before the
// person has any account, so these two cannot sit behind `protect`.
router.get("/token/:token", getInvitationByToken);
router.post("/accept", emailActionLimiter, acceptInvitation);

router.post("/", protect, requireRole(...ANY_ADMIN_STAFF), checkPermission("Invitations", "create"), bulkEmailActionLimiter, createInvitation);
router.get("/", protect, requireRole(...ANY_ADMIN_STAFF), checkPermission("Invitations", "view"), getInvitations);
router.post("/:id/resend", protect, requireRole(...ANY_ADMIN_STAFF), checkPermission("Invitations", "edit"), bulkEmailActionLimiter, resendInvitation);
router.post("/:id/revoke", protect, requireRole(...ANY_ADMIN_STAFF), checkPermission("Invitations", "delete"), revokeInvitation);

export default router;
