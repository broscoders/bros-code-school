import { Router } from "express";
import {
  getWebsitePages, saveWebsitePage, setWebsitePageStatus, setWebsiteSlug, getPublicSite,
} from "../controllers/websiteController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ROLES } from "../middleware/permissions";

const router = Router();

// Only SCHOOL_ADMIN/PRINCIPAL may edit or publish - the blueprint explicitly
// says ordinary teachers must not be able to publish official school content.
const SITE_EDITORS = [ROLES.SCHOOL_ADMIN, ROLES.PRINCIPAL];

router.get("/pages", protect, requireRole(...SITE_EDITORS), getWebsitePages);
router.post("/pages", protect, requireRole(...SITE_EDITORS), saveWebsitePage);
router.put("/pages/:id/status", protect, requireRole(...SITE_EDITORS), setWebsitePageStatus);
router.put("/slug", protect, requireRole(...SITE_EDITORS), setWebsiteSlug);

// Public - no login. Mounted separately at /public/site in app.ts.
export const publicWebsiteRouter = Router();
publicWebsiteRouter.get("/:slug", getPublicSite);

export default router;
