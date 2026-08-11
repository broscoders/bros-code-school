import { Router } from "express";
import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import AuditLog from "../models/AuditLog";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/", protect, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.find({ schoolId: req.query.schoolId }).sort({ createdAt: -1 }).limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
});

export default router;
