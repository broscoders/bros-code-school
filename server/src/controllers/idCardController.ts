import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import IDCardRecord, { type IDCardPersonType } from "../models/IDCardRecord";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import StaffProfile from "../models/StaffProfile";

// Issues (or returns the already-active) ID card for a person. This is what
// makes an ID card an official, trackable document rather than just a
// printable div - the card number is unique, permanent, and visible in the
// person's record from here on.
export const issueOrGetCard = async (req: AuthRequest, res: Response) => {
  try {
    const { personType, personId } = req.body;
    if (!["STUDENT", "TEACHER", "STAFF"].includes(personType)) {
      return res.status(400).json({ message: "Invalid person type" });
    }

    // Confirm the person actually belongs to this school before issuing
    // anything in their name - same tenant-isolation reasoning as
    // everywhere else this pattern appears.
    let person = null;
    if (personType === "STUDENT") person = await Student.findOne({ _id: personId, schoolId: req.user!.schoolId });
    else if (personType === "TEACHER") person = await Teacher.findOne({ _id: personId, schoolId: req.user!.schoolId });
    else person = await StaffProfile.findOne({ _id: personId, schoolId: req.user!.schoolId });
    if (!person) return res.status(404).json({ message: "Person not found in your school" });

    const existing = await IDCardRecord.findOne({ schoolId: req.user!.schoolId, personType, personId, isActive: true });
    if (existing) return res.json(existing);

    const prefix = personType === "STUDENT" ? "STU" : personType === "TEACHER" ? "TCH" : "STF";
    const card = await IDCardRecord.create({
      schoolId: req.user!.schoolId,
      personType,
      personId,
      cardNumber: `${prefix}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      issuedBy: req.user!.userId,
    });

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Deactivates the current card and issues a fresh one (lost/damaged card) -
// the old record and its number stay in history rather than being deleted.
export const reissueCard = async (req: AuthRequest, res: Response) => {
  try {
    const { personType, personId } = req.body;
    if (!["STUDENT", "TEACHER", "STAFF"].includes(personType)) {
      return res.status(400).json({ message: "Invalid person type" });
    }

    await IDCardRecord.updateMany({ schoolId: req.user!.schoolId, personType, personId, isActive: true }, { isActive: false });

    const prefix = personType === "STUDENT" ? "STU" : personType === "TEACHER" ? "TCH" : "STF";
    const card = await IDCardRecord.create({
      schoolId: req.user!.schoolId,
      personType,
      personId,
      cardNumber: `${prefix}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      issuedBy: req.user!.userId,
    });

    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Full issuance history for one person - staff can see every card that was
// ever issued to them, active or not.
export const getCardHistory = async (req: AuthRequest, res: Response) => {
  try {
    const personType = req.query.personType as IDCardPersonType;
    const personId = req.query.personId as string;
    const list = await IDCardRecord.find({ schoolId: req.user!.schoolId, personType, personId }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
