import { Router } from "express";
import {
  getMyNotifications, markNotificationRead, markAllRead,
  createIncident, getIncidents, updateIncidentStatus,
} from "../controllers/systemController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/checkPermission";
import { EVERYONE, ANY_ADMIN_STAFF, TEACHING_STAFF, DISCIPLINE_STAFF } from "../middleware/permissions";

const router = Router();

router.get("/notifications", protect, requireRole(...EVERYONE), getMyNotifications);
router.put("/notifications/:id/read", protect, requireRole(...EVERYONE), markNotificationRead);
router.put("/notifications/read-all", protect, requireRole(...EVERYONE), markAllRead);

// Discipline records are sensitive - teaching staff can report, only
// academic leadership (not front-desk/library/transport/accounts/medical
// staff, even though they're all "admin staff") can view or resolve them.
router.post("/discipline", protect, requireRole(...TEACHING_STAFF), createIncident);
router.get("/discipline", protect, requireRole(...DISCIPLINE_STAFF), getIncidents);
router.put("/discipline/:id", protect, requireRole(...DISCIPLINE_STAFF), checkPermission("Discipline", "edit"), updateIncidentStatus);

export default router;
