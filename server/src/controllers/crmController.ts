import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { canAccessStudent } from "../utils/accessControl";
import Lead from "../models/Lead";
import Admission from "../models/Admission";
import Certificate from "../models/Certificate";
import ClassModel from "../models/ClassModel";
import Student from "../models/Student";

// CRM / Leads
const LEAD_STATUSES = ["NEW", "CONTACTED", "DEMO_SCHEDULED", "CONVERTED", "LOST"];
const clean = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());

export const createLead = async (req: AuthRequest, res: Response) => {
  try {
    const name = clean(req.body.name);
    const contact = clean(req.body.contact);
    if (!name || !contact) return res.status(400).json({ message: "Name and contact are required" });
    // status always starts as NEW (a lead could be created already CONVERTED)
    const lead = await Lead.create({
      schoolId: req.user!.schoolId, name, contact,
      source: clean(req.body.source) || undefined,
      interestedIn: clean(req.body.interestedIn) || undefined,
      notes: clean(req.body.notes) || undefined,
    });
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
    const schoolId = req.user!.schoolId;
    const existingLead = await Lead.findOne({ _id: req.params.id, schoolId });
    if (!existingLead) return res.status(404).json({ message: "Lead not found" });

    // Only these fields can change - the whole request body used to be
    // applied, including schoolId.
    const update: Record<string, unknown> = {};
    if (req.body.status !== undefined) {
      if (!LEAD_STATUSES.includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
      update.status = req.body.status;
    }
    for (const f of ["name", "contact", "source", "interestedIn", "notes"] as const) {
      if (req.body[f] !== undefined) update[f] = clean(req.body[f]);
    }
    if (req.body.followUpDate !== undefined) {
      const d = req.body.followUpDate ? new Date(req.body.followUpDate) : null;
      if (d && Number.isNaN(d.getTime())) return res.status(400).json({ message: "Invalid follow-up date" });
      update.followUpDate = d;
    }
    if (Object.keys(update).length === 0) return res.status(400).json({ message: "Nothing to update" });

    // Blueprint section 82: converting a lead hands off into the Admissions
    // pipeline. An Admission REQUIRES a class, which this code never had - so
    // Admission.create threw AFTER the lead was already marked CONVERTED: the
    // user saw an error, the lead stayed "converted" and no admission existed.
    // Now the class is required up front and the admission is created first.
    let admissionCreated = false;
    if (update.status === "CONVERTED" && existingLead.status !== "CONVERTED") {
      const desiredClassId = req.body.desiredClassId;
      if (!desiredClassId) return res.status(400).json({ message: "Choose the class this child is applying for to convert the lead" });
      if (!(await ClassModel.exists({ _id: desiredClassId, schoolId }))) return res.status(404).json({ message: "Class not found in your school" });

      const lead = existingLead;
      const alreadyLinked = await Admission.findOne({ schoolId, applicantName: lead.name, parentContact: lead.contact });
      if (!alreadyLinked) {
        await Admission.create({
          schoolId,
          applicantName: lead.name,
          parentName: lead.name,
          parentContact: lead.contact,
          desiredClassId,
          academicSystem: lead.interestedIn || "Not specified",
          status: "APPLICATION",
        });
        admissionCreated = true;
      }
    }

    const lead = await Lead.findOneAndUpdate({ _id: req.params.id, schoolId }, update, { new: true });
    if (!lead) return res.status(404).json({ message: "Lead not found" });
    res.json({ ...lead.toObject(), admissionCreated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Certificates
export const issueCertificate = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const title = clean(req.body.title);
    if (!title) return res.status(400).json({ message: "Certificate title is required" });
    if (!["COMPLETION", "ACHIEVEMENT", "PARTICIPATION", "CUSTOM"].includes(req.body.type)) return res.status(400).json({ message: "Invalid certificate type" });
    // the student must be in this school - a certificate in the school's name
    // used to be issuable for any student id
    if (!(await Student.exists({ _id: req.body.studentId, schoolId }))) return res.status(404).json({ message: "Student not found in your school" });
    if (req.body.fileUrl && !/^https?:\/\//i.test(clean(req.body.fileUrl))) return res.status(400).json({ message: "Invalid file link" });

    // Date.now() alone repeats when two certificates are issued in the same
    // millisecond (the number is unique and also what the public verify link
    // uses) - add a random suffix so numbers can't collide or be guessed.
    const certificateNumber = "CERT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    const cert = await Certificate.create({
      schoolId, studentId: req.body.studentId, title, type: req.body.type, certificateNumber,
      fileUrl: clean(req.body.fileUrl) || undefined,
      courseId: req.body.courseId || undefined,
      batchId: req.body.batchId || undefined,
    });
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
    // This route is intentionally public - no login required - so the
    // student's contact details (email etc, pulled in by populate) must
    // never be part of the response. Only the minimal fields needed to
    // confirm a certificate's authenticity are returned; anyone who finds
    // or guesses a certificate number should not be able to harvest a
    // student's email from a "verify this certificate" page.
    const cert = await Certificate.findOne({ certificateNumber: req.params.number })
      .populate({ path: "studentId", select: "admissionNumber", populate: { path: "userId", select: "name" } })
      .populate({ path: "schoolId", select: "name logoUrl" });
    if (!cert) return res.status(404).json({ message: "Certificate not found" });

    res.json({
      certificateNumber: cert.certificateNumber,
      title: cert.title,
      type: cert.type,
      issueDate: cert.issueDate,
      studentName: (cert.studentId as any)?.userId?.name,
      schoolName: (cert.schoolId as any)?.name,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

