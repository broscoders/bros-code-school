import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Notification from "../models/Notification";
import DisciplineIncident from "../models/DisciplineIncident";
import CommunicationLog from "../models/CommunicationLog";
import { canAccessStudent, isAssignedToClass } from "../utils/accessControl";
import { notify } from "../utils/notifier";
import Parent from "../models/Parent";
import Student from "../models/Student";

export const getMyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Notification.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(30);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markNotificationRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.userId }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    await Notification.updateMany({ userId: req.user!.userId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createIncident = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const description = String(req.body.description || "").trim();
    if (!description) return res.status(400).json({ message: "A description is required" });
    if (!["WARNING", "MINOR", "MAJOR"].includes(req.body.incidentType)) return res.status(400).json({ message: "Invalid incident type" });
    const student = await Student.findOne({ _id: req.body.studentId, schoolId });
    if (!student) return res.status(404).json({ message: "Student not found in your school" });

    // A plain teacher can only report students of the classes they teach
    if (student.classId && !(await isAssignedToClass(req, student.classId.toString()))) {
      return res.status(403).json({ message: "You can only report students of your assigned classes" });
    }

    // reportedBy always comes from the login (the browser used to send it, so
    // a report could be filed in someone else's name). status/actionTaken are
    // admin-only (see updateIncidentStatus).
    const incident = await DisciplineIncident.create({
      schoolId,
      studentId: student._id,
      reportedBy: req.user!.userId,
      incidentType: req.body.incidentType,
      description,
      parentNotified: !!req.body.parentNotified,
    });

    if (req.body.parentNotified) {
      const parent = await Parent.findOne({ children: student._id, schoolId }).populate("userId");
      if (parent && (parent.userId as any)?._id) {
        await notify({
          schoolId,
          userId: (parent.userId as any)._id.toString(),
          title: "Discipline notice",
          message: `A discipline incident has been recorded for your child. Please check the portal for details.`,
          category: "SYSTEM",
        });
      }
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getIncidents = async (req: AuthRequest, res: Response) => {
  try {
    const list = await DisciplineIncident.find({ schoolId: req.user!.schoolId }).populate({ path: "studentId", populate: { path: "userId" } }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateIncidentStatus = async (req: AuthRequest, res: Response) => {
  try {
    // Only status and actionTaken can change. The whole request body used to
    // be applied as the update, which let a request rewrite schoolId,
    // studentId or reportedBy of an existing incident.
    const update: Record<string, unknown> = {};
    if (req.body.status !== undefined) {
      if (!["OPEN", "RESOLVED"].includes(req.body.status)) return res.status(400).json({ message: "Invalid status" });
      update.status = req.body.status;
    }
    if (req.body.actionTaken !== undefined) update.actionTaken = String(req.body.actionTaken).trim();
    if (Object.keys(update).length === 0) return res.status(400).json({ message: "Nothing to update" });
    const incident = await DisciplineIncident.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      update,
      { new: true }
    );
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint 61: createIncident already tells a notified parent to "check
// the portal for details" - but until now there was no page in the
// portal that would show them anything. canAccessStudent keeps this to
// the parent's own child (or the student themselves) only.
export const getMyChildDiscipline = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.query.studentId as string;
    if (!(await canAccessStudent(req, studentId))) {
      return res.status(403).json({ message: "Not authorized to view this student's records" });
    }
    const incidents = await DisciplineIncident.find({ studentId, schoolId: req.user!.schoolId })
      .select("-reportedBy")
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint 71 (Delivery Status): lets an admin actually answer "did this
// email go out?" instead of that information only existing (or not) in
// server logs. Scoped loosely on purpose - logs created before schoolId
// was threaded through every sendMail() call site won't have one, so this
// also returns those rather than hiding them.
export const getCommunicationLog = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await CommunicationLog.find({ schoolId: req.user!.schoolId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
