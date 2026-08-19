import { Router } from "express";
import {
  createLead, getLeads, updateLead,
  issueCertificate, getCertificatesBySchool, getMyCertificates, verifyCertificate,
} from "../controllers/crmController";
import { protect, requireRole } from "../middleware/authMiddleware";
import { ADMISSIONS_STAFF, ANY_ADMIN_STAFF, TOP_ADMIN, EVERYONE } from "../middleware/permissions";

const router = Router();

router.post("/leads", protect, requireRole(...ADMISSIONS_STAFF), createLead);
router.get("/leads", protect, requireRole(...ADMISSIONS_STAFF), getLeads);
router.put("/leads/:id", protect, requireRole(...ADMISSIONS_STAFF), updateLead);

router.post("/certificates", protect, requireRole(...TOP_ADMIN), issueCertificate);
router.get("/certificates", protect, requireRole(...ANY_ADMIN_STAFF), getCertificatesBySchool);
router.get("/certificates/my", protect, requireRole(...EVERYONE), getMyCertificates);

// Public by design: anyone with a certificate number can verify its authenticity (no login required).
router.get("/certificates/verify/:number", verifyCertificate);

export default router;
