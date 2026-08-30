import { Router } from "express";
import {
  createBuilding, getBuildings,
  createRoom, getRooms,
  allocateRoom, getAllocations, deallocateRoom,
} from "../controllers/hostelController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { HOSTEL_STAFF, ANY_ADMIN_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/buildings", protect, requireRole(...HOSTEL_STAFF), createBuilding);
router.get("/buildings", protect, requireRole(...ANY_ADMIN_STAFF), getBuildings);

router.post("/rooms", protect, requireRole(...HOSTEL_STAFF), createRoom);
router.get("/rooms", protect, requireRole(...ANY_ADMIN_STAFF), getRooms);

router.post("/allocate", protect, requireRole(...HOSTEL_STAFF), allocateRoom);
router.get("/allocations", protect, requireRole(...ANY_ADMIN_STAFF), getAllocations);
router.put("/allocations/:id/deallocate", protect, requireRole(...HOSTEL_STAFF), deallocateRoom);

export default router;
