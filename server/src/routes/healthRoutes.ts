import { Router } from "express";
import {
  checkInVisitor, getVisitors, checkOutVisitor,
  upsertHealthProfile, getHealthProfile,
  createMedicalIncident, getMedicalIncidents, updateMedicalIncident,
} from "../controllers/healthController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { FRONT_DESK_STAFF, MEDICAL_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/visitors", protect, requireRole(...FRONT_DESK_STAFF), checkInVisitor);
router.get("/visitors", protect, requireRole(...FRONT_DESK_STAFF), getVisitors);
router.put("/visitors/:id/checkout", protect, requireRole(...FRONT_DESK_STAFF), checkOutVisitor);

router.post("/health-profile", protect, requireRole(...MEDICAL_STAFF), upsertHealthProfile);
router.get("/health-profile", protect, requireRole(...MEDICAL_STAFF), getHealthProfile);

router.post("/medical-incidents", protect, requireRole(...MEDICAL_STAFF), createMedicalIncident);
router.get("/medical-incidents", protect, requireRole(...MEDICAL_STAFF), getMedicalIncidents);
router.put("/medical-incidents/:id", protect, requireRole(...MEDICAL_STAFF), updateMedicalIncident);

export default router;
