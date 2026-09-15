import { Router } from "express";
import {
  checkInVisitor, getVisitors, checkOutVisitor,
  upsertHealthProfile, getHealthProfile,
  createMedicalIncident, getMedicalIncidents, updateMedicalIncident,
} from "../controllers/healthController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { FRONT_DESK_STAFF, MEDICAL_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/visitors", protect, requireRole(...FRONT_DESK_STAFF), checkInVisitor);
router.get("/visitors", protect, requireRole(...FRONT_DESK_STAFF), getVisitors);
router.put("/visitors/:id/checkout", protect, requireRole(...FRONT_DESK_STAFF), checkOutVisitor);

router.post("/health-profile", protect, requireRole(...MEDICAL_STAFF), upsertHealthProfile);
// Blueprint 24/51: parents (and the student themselves) can view - not
// edit - their own child's health profile. canAccessStudent inside the
// controller enforces "own child only"; MEDICAL_STAFF keeps full access.
router.get("/health-profile", protect, requireRole(...EVERYONE), getHealthProfile);

router.post("/medical-incidents", protect, requireRole(...MEDICAL_STAFF), createMedicalIncident);
router.get("/medical-incidents", protect, requireRole(...MEDICAL_STAFF), getMedicalIncidents);
router.put("/medical-incidents/:id", protect, requireRole(...MEDICAL_STAFF), updateMedicalIncident);

export default router;
