import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import PlatformAdmin from "../models/PlatformAdmin";

export const platformLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await PlatformAdmin.findOne({ email });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const secret = process.env.PLATFORM_JWT_SECRET || process.env.JWT_SECRET || "dev_secret_change_this";
    const token = jwt.sign({ platformAdminId: admin.id.toString(), role: admin.role }, secret, { expiresIn: "7d" });

    res.json({
      admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
