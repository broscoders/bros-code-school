import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Lead from "../models/Lead";
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
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      req.body,
      { new: true }
    );
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
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

