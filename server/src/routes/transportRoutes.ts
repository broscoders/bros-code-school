import { Router } from "express";
import { addVehicle, getVehicles, assignStudentToVehicle, getTransportAssignments, removeTransportAssignment } from "../controllers/transportController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { TRANSPORT_STAFF, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/vehicles", protect, requireRole(...TRANSPORT_STAFF), addVehicle);
router.get("/vehicles", protect, requireRole(...EVERYONE), getVehicles);
router.post("/assign", protect, requireRole(...TRANSPORT_STAFF), assignStudentToVehicle);
router.get("/assignments", protect, requireRole(...TRANSPORT_STAFF), getTransportAssignments);
router.put("/assign/:id/remove", protect, requireRole(...TRANSPORT_STAFF), removeTransportAssignment);

export default router;