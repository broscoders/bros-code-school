import { Router } from "express";
import {
  createBuilding, getBuildings,
  createRoom, getRooms,
  allocateRoom, getAllocations,
} from "../controllers/hostelController";

const router = Router();

router.post("/buildings", createBuilding);
router.get("/buildings", getBuildings);

router.post("/rooms", createRoom);
router.get("/rooms", getRooms);

router.post("/allocate", allocateRoom);
router.get("/allocations", getAllocations);

export default router;
