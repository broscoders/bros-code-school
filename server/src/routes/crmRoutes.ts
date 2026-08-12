import { Router } from "express";
import {
  createLead, getLeads, updateLead,
  issueCertificate, getCertificatesBySchool, getMyCertificates, verifyCertificate,
} from "../controllers/crmController";

const router = Router();

router.post("/leads", createLead);
router.get("/leads", getLeads);
router.put("/leads/:id", updateLead);

router.post("/certificates", issueCertificate);
router.get("/certificates", getCertificatesBySchool);
router.get("/certificates/my", getMyCertificates);
router.get("/certificates/verify/:number", verifyCertificate);

export default router;
