import { Router } from "express";
import {
  getMyNotifications, markNotificationRead, markAllRead,
  createIncident, getIncidents, updateIncidentStatus,
} from "../controllers/systemController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { checkPermission } from "../middleware/checkPermission";
import { EVERYONE, ANY_ADMIN_STAFF, TEACHING_STAFF } from "../middleware/permissions";

const router = Router();

router.get("/notifications", protect, requireRole(...EVERYONE), getMyNotifications);
router.put("/notifications/:id/read", protect, requireRole(...EVERYONE), markNotificationRead);
router.put("/notifications/read-all", protect, requireRole(...EVERYONE), markAllRead);

// Discipline records are sensitive - teaching staff can report, admin oversees.
router.post("/discipline", protect, requireRole(...TEACHING_STAFF), createIncident);
router.get("/discipline", protect, requireRole(...ANY_ADMIN_STAFF), getIncidents);
router.put("/discipline/:id", protect, requireRole(...ANY_ADMIN_STAFF), checkPermission("Discipline", "edit"), updateIncidentStatus);

export default router;
