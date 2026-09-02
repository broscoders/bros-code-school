import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import Permission from "../models/Permission";
import User from "../models/User";
import { logAudit } from "../utils/auditLogger";

const MODULES = ["Students", "Teachers", "Attendance", "Homework", "Exams", "Fees", "Admissions", "Academy", "Announcements", "Reports", "Discipline"];

const DEFAULT_ROLES: Record<string, Record<string, boolean>> = {
  SCHOOL_ADMIN: { view: true, create: true, edit: true, delete: true },
  PRINCIPAL: { view: true, create: false, edit: false, delete: false },
  ACCOUNTANT: { view: true, create: true, edit: true, delete: false },
  ADMISSION_STAFF: { view: true, create: true, edit: false, delete: false },
  RECEPTIONIST: { view: true, create: false, edit: false, delete: false },
};

export const getPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const existing = await Permission.find({ schoolId });
    if (existing.length > 0) return res.json(existing);

    const seeded = [];
    for (const [roleName, defaultAccess] of Object.entries(DEFAULT_ROLES)) {
      const modules: Record<string, any> = {};
      MODULES.forEach((m) => (modules[m] = defaultAccess));
      const perm = await Permission.create({ schoolId, roleName, isCustom: false, modules });
      seeded.push(perm);
    }
    res.json(seeded);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updatePermission = async (req: AuthRequest, res: Response) => {
  try {
    const before = await Permission.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!before) return res.status(404).json({ message: "Permission not found" });

    const perm = await Permission.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { modules: req.body.modules },
      { new: true }
    );

    // Blueprint explicitly requires "Permission changed -> Audit record" -
    // this is who-can-do-what for an entire role, so changes here need the
    // same trail as fee/marks/attendance changes already have.
    const actingUser = await User.findById(req.user!.userId).select("name");
    await logAudit({
      schoolId: req.user!.schoolId,
      userId: req.user!.userId,
      userName: actingUser?.name || "Unknown",
      userRole: req.user!.role,
      action: `Updated permissions for role "${before.roleName}"`,
      recordType: "Permission",
      recordId: before._id.toString(),
      oldValue: before.modules,
      newValue: perm?.modules,
    });

    res.json(perm);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createCustomRole = async (req: AuthRequest, res: Response) => {
  try {
    const modules: Record<string, any> = {};
    MODULES.forEach((m) => (modules[m] = { view: false, create: false, edit: false, delete: false }));
    const perm = await Permission.create({ schoolId: req.user!.schoolId, roleName: req.body.roleName, isCustom: true, modules });
    res.status(201).json(perm);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getModuleList = async (req: AuthRequest, res: Response) => {
  res.json(MODULES);
};
