import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent } from "../utils/accessControl";
import Lead from "../models/Lead";
import Admission from "../models/Admission";
import Certificate from "../models/Certificate";

// CRM / Leads
export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.create({ ...req.body, schoolId: req.user!.schoolId });
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const leads = await Lead.find({ schoolId: req.user!.schoolId }).populate("assignedTo").sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateLead = async (req: AuthRequest, res: Response) => {
  try {
    const existingLead = await Lead.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!existingLead) return res.status(404).json({ message: "Lead not found" });

    const wasNotConverted = existingLead.status !== "CONVERTED";
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      req.body,
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });

    // Blueprint section 82: converting a lead should hand off into the
    // Admissions pipeline automatically, not just flip a status label.
    let admissionCreated = false;
    if (req.body.status === "CONVERTED" && wasNotConverted) {
      const alreadyLinked = await Admission.findOne({ schoolId: req.user!.schoolId, applicantName: lead.name, parentContact: lead.contact });
      if (!alreadyLinked) {
        await Admission.create({
          schoolId: req.user!.schoolId,
          applicantName: lead.name,
          parentName: lead.name,
          parentContact: lead.contact,
          academicSystem: lead.interestedIn || "Not specified",
          status: "APPLICATION",
        });
        admissionCreated = true;
      }
    }

    res.json({ ...lead.toObject(), admissionCreated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Certificates
export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const certificateNumber = "CERT-" + Date.now().toString(36).toUpperCase();
    const cert = await Certificate.create({ ...req.body, schoolId: req.user!.schoolId, certificateNumber });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getCertificatesBySchool = async (req: AuthRequest, res: Response) => {
  try {
    const certs = await Certificate.find({ schoolId: req.user!.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyCertificates = async (req: AuthRequest, res: Response) => {
  try {
    const allowed = await canAccessStudent(req, req.query.studentId as string);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this student" });

    const certs = await Certificate.find({ schoolId: req.user!.schoolId, studentId: req.query.studentId as string }).sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Public by design: certificate verification works across schools with no auth,
// since anyone holding a certificate number should be able to confirm it's genuine.
export const verifyCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const cert = await Certificate.findOne({ certificateNumber: req.params.number }).populate({ path: "studentId", populate: { path: "userId" } });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

