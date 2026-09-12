import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getJwtSecret } from "./jwtSecret";

// Every token gets a unique `jti` so a single login (one device/browser)
// maps to exactly one Session record - see models/Session.ts. Callers
// that need to create the Session row need the jti back, so this returns
// both instead of just the signed string.
export const generateToken = (userId: string, role: string, schoolId: string): { token: string; jti: string } => {
  const secret = getJwtSecret();
  const jti = crypto.randomUUID();
  const token = jwt.sign({ userId, role, schoolId, jti }, secret, { expiresIn: "7d" });
  return { token, jti };
};