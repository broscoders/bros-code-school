import { Router } from "express";
import { createSchool, getSchools, getSchoolById, updateSchool } from "../controllers/schoolController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { protectPlatform } from "../middleware/platformAuthMiddleware";
import School from "../models/School";

const router = Router();

router.get("/public/branding", async (req, res) => {
  try {
    // This endpoint is public (used on the login page, before anyone is
    // signed in) so it cannot know which school the visitor belongs to. It
    // used to return whichever active school happened to be first, so every
    // school's login page showed the first school's name and logo. Now:
    //  1) ?schoolId=... returns that school
    //  2) BRANDING_SCHOOL_ID in the server env pins one school (use this when
    //     each customer school has its own deployment)
    //  3) otherwise, only if exactly ONE active school exists, return it
    //  4) otherwise return null (the app shows the generic Bro's Code logo)
    const wanted = (req.query.schoolId as string) || process.env.BRANDING_SCHOOL_ID;
    if (wanted) {
      const byId = /^[a-f\d]{24}$/i.test(wanted) ? await School.findOne({ _id: wanted, isActive: true }).select("name logoUrl") : null;
      return res.json(byId || null);
    }
    const active = await School.find({ isActive: true }).select("name logoUrl").limit(2);
    res.json(active.length === 1 ? active[0] : null);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protectPlatform, createSchool);
router.get("/", protectPlatform, getSchools);
router.get("/:id", protect, getSchoolById);
router.put("/:id", protect, requireRole("SCHOOL_ADMIN", "PRINCIPAL"), updateSchool);

export default router;