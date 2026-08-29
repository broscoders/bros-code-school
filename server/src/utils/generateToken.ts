import jwt from "jsonwebtoken";
import { getJwtSecret } from "./jwtSecret";

export const generateToken = (userId: string, role: string, schoolId: string) => {
  const secret = getJwtSecret();
  return jwt.sign({ userId, role, schoolId }, secret, { expiresIn: "7d" });
};