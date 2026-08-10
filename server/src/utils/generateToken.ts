import jwt from "jsonwebtoken";

export const generateToken = (userId: string, role: string, schoolId: string) => {
  const secret = process.env.JWT_SECRET || "dev_secret_change_this";
  return jwt.sign({ userId, role, schoolId }, secret, { expiresIn: "7d" });
};