import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import SchoolDocument from "../models/SchoolDocument";
import { canAccessStudent } from "../utils/accessControl";
import { actorName } from "../utils/auditActor";
import { logAudit } from "../utils/auditLogger";

const DOC_CATEGORIES = ["STUDENT", "PARENT", "TEACHER", "STAFF", "SCHOOL", "CONTRACT", "CERTIFICATE", "REPORT"];

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { category, relatedToId } = req.body;
    const title = String(req.body.title || "").trim();
    const fileUrl = String(req.body.fileUrl || "").trim();
    if (!DOC_CATEGORIES.includes(category)) return res.status(400).json({ message: "Please choose a valid document category" });
    if (!title || !fileUrl) return res.status(400).json({ message: "Title and file are required" });
    if (!/^https?:\/\//i.test(fileUrl)) return res.status(400).json({ message: "Invalid file link" });
    let expiryDate: Date | undefined;
    if (req.body.expiryDate) {
      expiryDate = new Date(req.body.expiryDate);
      if (Number.isNaN(expiryDate.getTime())) return res.status(400).json({ message: "Invalid expiry date" });
    }

    // Version = highest existing version + 1. It used to be (count + 1), so
    // after deleting one version the next upload reused an existing number.
    const latest = await SchoolDocument.findOne({ schoolId, category, title, relatedToId: relatedToId || null }).sort({ version: -1 }).select("version");

    const doc = await SchoolDocument.create({
      schoolId,
      category,
      title,
      fileUrl,
      relatedToId: relatedToId || undefined,
      expiryDate,
      uploadedBy: req.user!.userId,
      uploadedByName: await actorName(req),
      version: (latest?.version || 0) + 1,
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, any> = { schoolId: req.user!.schoolId };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.relatedToId) filter.relatedToId = req.query.relatedToId;

    const docs = await SchoolDocument.find(filter).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMyDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const relatedToId = req.query.relatedToId as string;
    // getMyDocuments is reachable by every role including PARENT/STUDENT -
    // without this check, any of them could read another family's
    // documents just by passing a different relatedToId.
    const allowed = await canAccessStudent(req, relatedToId);
    if (!allowed) return res.status(403).json({ message: "You do not have access to this record's documents" });

    const docs = await SchoolDocument.find({
      schoolId: req.user!.schoolId,
      relatedToId,
    }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getExpiringDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const requested = Number(req.query.days);
    const daysAhead = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 3650) : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    const docs = await SchoolDocument.find({
      schoolId: req.user!.schoolId,
      expiryDate: { $ne: null, $lte: cutoff },
    }).sort({ expiryDate: 1 });

    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const doc = await SchoolDocument.findOneAndDelete({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!doc) return res.status(404).json({ message: "Document not found" });
    // deleting a school document (contracts, certificates...) leaves a trace
    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: await actorName(req),
      userRole: req.user!.role,
      action: `Deleted document "${doc.title}"`,
      recordType: "SchoolDocument",
      recordId: doc._id.toString(),
      oldValue: { category: doc.category, title: doc.title, version: doc.version },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
