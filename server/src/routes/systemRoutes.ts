import { Router } from "express";
import {
  getMyNotifications, markNotificationRead, markAllRead,
  createIncident, getIncidents, updateIncidentStatus,
} from "../controllers/systemController";

const router = Router();

router.get("/notifications", getMyNotifications);
router.put("/notifications/:id/read", markNotificationRead);
router.put("/notifications/read-all", markAllRead);

router.post("/discipline", createIncident);
router.get("/discipline", getIncidents);
router.put("/discipline/:id", updateIncidentStatus);

export default router;
