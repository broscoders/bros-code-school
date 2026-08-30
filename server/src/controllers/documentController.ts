import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import SchoolDocument from "../models/SchoolDocument";
import { canAccessStudent } from "../utils/accessControl";

export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const { category, title, fileUrl, relatedToId, expiryDate } = req.body;

    const existingCount = await SchoolDocument.countDocuments({
      schoolId: req.user!.schoolId,
      category,
      title,
      relatedToId: relatedToId || null,
    });

    const doc = await SchoolDocument.create({
      schoolId: req.user!.schoolId,
      category,
      title,
      fileUrl,
      relatedToId: relatedToId || undefined,
      expiryDate: expiryDate || undefined,
      uploadedBy: req.user!.userId,
      uploadedByName: req.body.uploadedByName || "Unknown",
      version: existingCount + 1,
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
    const daysAhead = Number(req.query.days) || 30;
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
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
