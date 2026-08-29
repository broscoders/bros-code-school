import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getPlatformJwtSecret } from "../utils/jwtSecret";

export interface PlatformAuthRequest extends Request {
  platformAdmin?: {
    id: string;
    role: string;
  };
}

export const protectPlatform = (req: PlatformAuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getPlatformJwtSecret()) as {
      platformAdminId: string;
      role: string;
    };
    req.platformAdmin = { id: decoded.platformAdminId, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

export const requirePlatformRole = (...roles: string[]) => {
  return (req: PlatformAuthRequest, res: Response, next: NextFunction) => {
    if (!req.platformAdmin || !roles.includes(req.platformAdmin.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient platform permissions" });
    }
    next();
  };
};
