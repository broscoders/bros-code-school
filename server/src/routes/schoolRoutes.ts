import { Router } from "express";
import { createSchool, getSchools, getSchoolById, updateSchool } from "../controllers/schoolController";
import { protect, requireRole } from "../middleware/authMiddleware";
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

router.post("/", createSchool);
router.get("/", getSchools);
router.get("/:id", getSchoolById);
router.put("/:id", protect, requireRole("SCHOOL_ADMIN", "PRINCIPAL"), updateSchool);

export default router;
