import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import IDCardRecord, { type IDCardPersonType } from "../models/IDCardRecord";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import StaffProfile from "../models/StaffProfile";

async function personBelongsToSchool(personType: string, personId: string, schoolId: string) {
  if (!personId) return false;
  if (personType === "STUDENT") return !!(await Student.exists({ _id: personId, schoolId }));
  if (personType === "TEACHER") return !!(await Teacher.exists({ _id: personId, schoolId }));
  return !!(await StaffProfile.exists({ _id: personId, schoolId }));
}

// The card number is random, so two people can (rarely) draw the same one and
// the unique index then throws a raw database error. Retry with a new number.
async function createCard(schoolId: string, personType: IDCardPersonType, personId: string, issuedBy: string) {
  const prefix = personType === "STUDENT" ? "STU" : personType === "TEACHER" ? "TCH" : "STF";
  let lastErr: unknown;
  for (let i = 0; i < 5; i++) {
    try {
      return await IDCardRecord.create({
        schoolId, personType, personId, issuedBy,
        cardNumber: `${prefix}-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    } catch (err: any) {
      lastErr = err;
      if (err?.code !== 11000) throw err;
    }
  }
  throw lastErr;
}

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
    if (!(await personBelongsToSchool(personType, personId, req.user!.schoolId))) {
      return res.status(404).json({ message: "Person not found in your school" });
    }

    const existing = await IDCardRecord.findOne({ schoolId: req.user!.schoolId, personType, personId, isActive: true });
    if (existing) return res.json(existing);

    res.status(201).json(await createCard(req.user!.schoolId, personType, personId, req.user!.userId));
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
    // reissue skipped this check entirely - it would create a card record for
    // any id, even one that is not a person in this school
    if (!(await personBelongsToSchool(personType, personId, req.user!.schoolId))) {
      return res.status(404).json({ message: "Person not found in your school" });
    }

    // create the new card FIRST, then retire the old ones: if creating failed
    // after the old card was deactivated the person ended up with no valid card
    const card = await createCard(req.user!.schoolId, personType, personId, req.user!.userId);
    await IDCardRecord.updateMany({ schoolId: req.user!.schoolId, personType, personId, isActive: true, _id: { $ne: card._id } }, { isActive: false });

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
