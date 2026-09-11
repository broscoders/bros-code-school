import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { getJwtSecret } from "../utils/jwtSecret";
import Session from "../models/Session";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
    schoolId: string;
    jti?: string;
  };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as {
      userId: string;
      role: string;
      schoolId: string;
      jti?: string;
    };

    // Tokens issued before session tracking existed have no `jti` - let
    // those keep working under the old stateless rules rather than
    // force-logging-out everyone the moment this deploys. Anything issued
    // from now on always has one, so this branch fades out on its own as
    // old tokens expire (7 day max lifetime).
    if (decoded.jti) {
      const session = await Session.findOne({ jti: decoded.jti, userId: decoded.userId });
      if (!session || session.revoked) {
        return res.status(401).json({ message: "This session has ended. Please log in again." });
      }
      // Best-effort, don't block the request on it.
      Session.updateOne({ _id: session._id }, { lastSeenAt: new Date() }).catch(() => {});
    }

    // Re-checked on every request (not just at login) so suspending or
    // archiving an account takes effect immediately, even for a token
    // that's still within its 7-day validity window.
    const user = await User.findById(decoded.userId).select("accountStatus");
    if (!user) {
      return res.status(401).json({ message: "Not authorized, account no longer exists" });
    }
    if (user.accountStatus === "SUSPENDED") {
      return res.status(403).json({ message: "This account has been suspended." });
    }
    if (user.accountStatus === "ARCHIVED") {
      return res.status(403).json({ message: "This account is no longer active." });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
