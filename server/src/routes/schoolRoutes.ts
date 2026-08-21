import { Router } from "express";
import { createSchool, getSchools, getSchoolById, updateSchool } from "../controllers/schoolController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { protectPlatform } from "../middleware/platformAuthMiddleware";
import School from "../models/School";

const router = Router();

router.get("/public/branding", async (req, res) => {
  try {
    const school = await School.findOne({ isActive: true }).select("name logoUrl");
    res.json(school || null);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protectPlatform, createSchool);
router.get("/", protectPlatform, getSchools);
router.get("/:id", protect, getSchoolById);
router.put("/:id", protect, requireRole("SCHOOL_ADMIN", "PRINCIPAL"), updateSchool);

export default router;