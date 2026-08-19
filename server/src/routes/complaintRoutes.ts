import { Router } from "express";
import { createComplaint, getComplaints, updateComplaintStatus } from "../controllers/complaintController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { EVERYONE, FRONT_DESK_STAFF } from "../middleware/permissions";

const router = Router();

router.post("/", protect, requireRole(...EVERYONE), createComplaint);
router.get("/", protect, requireRole(...FRONT_DESK_STAFF), getComplaints);
router.put("/:id/status", protect, requireRole(...FRONT_DESK_STAFF), updateComplaintStatus);

export default router;
