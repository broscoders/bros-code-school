import type { Request, Response } from "express";
import Permission from "../models/Permission";

const MODULES = ["Students", "Teachers", "Attendance", "Homework", "Exams", "Fees", "Admissions", "Academy", "Announcements", "Reports"];

const DEFAULT_ROLES: Record<string, Record<string, boolean>> = {
  SCHOOL_ADMIN: { view: true, create: true, edit: true, delete: true },
  PRINCIPAL: { view: true, create: false, edit: false, delete: false },
  ACCOUNTANT: { view: true, create: true, edit: true, delete: false },
  ADMISSION_STAFF: { view: true, create: true, edit: false, delete: false },
  RECEPTIONIST: { view: true, create: false, edit: false, delete: false },
};

export const getPermissions = async (req: Request, res: Response) => {
  try {
    const existing = await Permission.find({ schoolId: req.query.schoolId });
    if (existing.length > 0) return res.json(existing);

    // Seed defaults for this school on first access
    const seeded = [];
    for (const [roleName, defaultAccess] of Object.entries(DEFAULT_ROLES)) {
      const modules: Record<string, any> = {};
      MODULES.forEach((m) => (modules[m] = defaultAccess));
      const perm = await Permission.create({ schoolId: req.query.schoolId, roleName, isCustom: false, modules });
      seeded.push(perm);
    }
    res.json(seeded);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updatePermission = async (req: Request, res: Response) => {
  try {
    const perm = await Permission.findByIdAndUpdate(req.params.id, { modules: req.body.modules }, { new: true });
    if (!perm) return res.status(404).json({ message: "Permission not found" });
    res.json(perm);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const createCustomRole = async (req: Request, res: Response) => {
  try {
    const modules: Record<string, any> = {};
    MODULES.forEach((m) => (modules[m] = { view: false, create: false, edit: false, delete: false }));
    const perm = await Permission.create({ schoolId: req.body.schoolId, roleName: req.body.roleName, isCustom: true, modules });
    res.status(201).json(perm);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getModuleList = async (req: Request, res: Response) => {
  res.json(MODULES);
};
