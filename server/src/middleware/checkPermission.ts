import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./authMiddleware";
import Permission from "../models/Permission";

const TOP_ADMIN_ROLES = new Set(["SCHOOL_ADMIN", "PRINCIPAL"]);

// Enforces the actual Permission records an admin configures in the
// Roles & Permissions screen. School Admin / Principal always pass (they are
// the ones who configure permissions for everyone else, so they cannot be
// locked out by their own settings). If no Permission record exists yet for
// a role/module (not configured), this defaults to ALLOW so existing
// requireRole() checks keep working exactly as before until an admin
// explicitly restricts something.
export function checkPermission(moduleName: string, action: "view" | "create" | "edit" | "delete") {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const role = req.user!.role;
      if (TOP_ADMIN_ROLES.has(role)) return next();

      const permission = await Permission.findOne({ schoolId: req.user!.schoolId, roleName: role });
      if (!permission) return next();

      const moduleAccess = permission.modules?.get
        ? permission.modules.get(moduleName)
        : (permission.modules as any)?.[moduleName];

      if (!moduleAccess) return next();

      if (moduleAccess[action] === false) {
        return res.status(403).json({ message: `Your role does not have "${action}" access to ${moduleName}` });
      }

      next();
    } catch (err) {
      res.status(500).json({ message: "Permission check failed", error: (err as Error).message });
    }
  };
}