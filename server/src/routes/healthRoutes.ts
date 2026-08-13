import { Router } from "express";
import {
  checkInVisitor, getVisitors, checkOutVisitor,
  upsertHealthProfile, getHealthProfile,
  createMedicalIncident, getMedicalIncidents,
} from "../controllers/healthController";

const router = Router();

router.post("/visitors", checkInVisitor);
router.get("/visitors", getVisitors);
router.put("/visitors/:id/checkout", checkOutVisitor);

router.post("/health-profile", upsertHealthProfile);
router.get("/health-profile", getHealthProfile);

router.post("/medical-incidents", createMedicalIncident);
router.get("/medical-incidents", getMedicalIncidents);

export default router;
