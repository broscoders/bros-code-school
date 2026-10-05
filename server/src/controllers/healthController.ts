import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Visitor from "../models/Visitor";
import HealthProfile from "../models/HealthProfile";
import MedicalIncident from "../models/MedicalIncident";
import Parent from "../models/Parent";
import Student from "../models/Student";
import { notify } from "../utils/notifier";
import { canAccessStudent } from "../utils/accessControl";

// Visitors
export const checkInVisitor = async (req: AuthRequest, res: Response) => {
  try {
    const name = String(req.body.name || "").trim();
    const contact = String(req.body.contact || "").trim();
    const purpose = String(req.body.purpose || "").trim();
    const personToMeet = String(req.body.personToMeet || "").trim();
    if (!name || !contact || !purpose || !personToMeet) {
      return res.status(400).json({ message: "Name, contact, purpose and person to meet are required" });
    }
    // checkInTime/status are set by the server, not the browser
    const visitor = await Visitor.create({ schoolId: req.user!.schoolId, name, contact, purpose, personToMeet });
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getVisitors = async (req: AuthRequest, res: Response) => {
  try {
    const visitors = await Visitor.find({ schoolId: req.user!.schoolId }).sort({ checkInTime: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const checkOutVisitor = async (req: AuthRequest, res: Response) => {
  try {
    // only a visitor who is still checked in can be checked out (a second
    // click used to overwrite the real checkout time)
    const visitor = await Visitor.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId, status: "CHECKED_IN" },
      { status: "CHECKED_OUT", checkOutTime: new Date() },
      { new: true }
    );
    if (!visitor) return res.status(400).json({ message: "Visitor not found or already checked out" });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Health profiles (most sensitive data in the system - always scoped to the caller's school)
export const upsertHealthProfile = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId } = req.body;
    if (!studentId) return res.status(400).json({ message: "Student is required" });
    // the student must be in THIS school (a foreign id used to create a
    // health record under your school pointing at someone else's student)
    if (!(await Student.exists({ _id: studentId, schoolId }))) return res.status(404).json({ message: "Student not found in your school" });
    const clean = (v: any) => (v === undefined || v === null ? undefined : String(v).trim());
    const profile = await HealthProfile.findOneAndUpdate(
      { studentId, schoolId },
      {
        $set: {
          schoolId,
          studentId,
          bloodGroup: clean(req.body.bloodGroup),
          allergies: clean(req.body.allergies),
          emergencyContactName: clean(req.body.emergencyContactName),
          emergencyContactPhone: clean(req.body.emergencyContactPhone),
          medicalNotes: clean(req.body.medicalNotes),
        },
      },
      { upsert: true, new: true }
    );
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getHealthProfile = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.query.studentId as string;
    // Blueprint 24/51: a parent should be able to see their own child's
    // allergy/health info even though editing it stays medical-staff-only
    // (route-level MEDICAL_STAFF gate already covers the write side).
    if (!(await canAccessStudent(req, studentId))) {
      return res.status(403).json({ message: "Not authorized to view this student's health profile" });
    }
    const profile = await HealthProfile.findOne({ studentId, schoolId: req.user!.schoolId });
    res.json(profile || null);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Medical incidents
export const createMedicalIncident = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId, severity, followUpRequired, followUpNotes } = req.body;
    const description = String(req.body.description || "").trim();
    const actionTaken = String(req.body.actionTaken || "").trim();
    if (!studentId || !description || !actionTaken) return res.status(400).json({ message: "Student, description and action taken are required" });
    if (severity && !["MINOR", "MODERATE", "SEVERE", "EMERGENCY"].includes(severity)) return res.status(400).json({ message: "Invalid severity" });
    if (!(await Student.exists({ _id: studentId, schoolId }))) return res.status(404).json({ message: "Student not found in your school" });

    // recordedBy comes from the login; parentNotified starts false and is set
    // true below only after a notification is actually created
    const incident = await MedicalIncident.create({
      schoolId, studentId, description, actionTaken,
      severity: severity || "MINOR",
      followUpRequired: !!followUpRequired,
      followUpNotes: followUpNotes ? String(followUpNotes).trim() : undefined,
      recordedBy: req.user!.userId,
      parentNotified: false,
    });

    // MODERATE severity and above auto-notifies the parent - a minor scrape
    // doesn't need one, but anything past that a parent should hear about
    // the same day, not find out only if they happen to ask.
    if (["MODERATE", "SEVERE", "EMERGENCY"].includes(incident.severity)) {
      const parent = await Parent.findOne({ children: incident.studentId, schoolId: req.user!.schoolId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId: req.user!.schoolId,
          userId: (parent.userId as any)._id.toString(),
          title: incident.severity === "EMERGENCY" ? "Medical emergency - please contact the school" : "Medical incident reported",
          message: `Your child had a ${incident.severity.toLowerCase()} medical incident today. Please check with the school nurse for details.`,
          category: "HEALTH",
        });
        incident.parentNotified = true;
        await incident.save();
      }
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateMedicalIncident = async (req: AuthRequest, res: Response) => {
  try {
    const { status, followUpRequired, followUpNotes } = req.body;
    if (status && !["OPEN", "MONITORING", "RESOLVED", "REFERRED_TO_HOSPITAL"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const incident = await MedicalIncident.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { ...(status ? { status } : {}), ...(followUpRequired !== undefined ? { followUpRequired } : {}), ...(followUpNotes !== undefined ? { followUpNotes } : {}) },
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getMedicalIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const list = await MedicalIncident.find({ schoolId: req.user!.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ incidentDate: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

