import type { Request, Response } from "express";
import Lead from "../models/Lead";
import Certificate from "../models/Certificate";

// CRM / Leads
export const createLead = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.create(req.body);
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await Lead.find({ schoolId: req.query.schoolId }).populate("assignedTo").sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Certificates
export const issueCertificate = async (req: Request, res: Response) => {
  try {
    const certificateNumber = "CERT-" + Date.now().toString(36).toUpperCase();
    const cert = await Certificate.create({ ...req.body, certificateNumber });
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getCertificatesBySchool = async (req: Request, res: Response) => {
  try {
    const certs = await Certificate.find({ schoolId: req.query.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyCertificates = async (req: Request, res: Response) => {
  try {
    const certs = await Certificate.find({ studentId: req.query.studentId }).sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const cert = await Certificate.findOne({ certificateNumber: req.params.number }).populate({ path: "studentId", populate: { path: "userId" } });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
