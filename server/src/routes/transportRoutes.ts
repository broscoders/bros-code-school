import { Router } from "express";
import { addVehicle, getVehicles } from "../controllers/transportController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TRANSPORT_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/vehicles", protect, requireRole(...TRANSPORT_STAFF), addVehicle);
router.get("/vehicles", protect, requireRole(...EVERYONE), getVehicles);

export default router;
