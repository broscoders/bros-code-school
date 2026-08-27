import type { Response } from "express";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Student from "../models/Student";

interface RowInput {
  name: string;
  email: string;
  admissionNumber: string;
  classId: string;
  sectionId: string;
}

export const bulkImportStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { rows } = req.body as { rows: RowInput[] };
    const schoolId = req.user!.schoolId;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ message: "rows array is required" });
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        if (!row.name || !row.email || !row.admissionNumber || !row.classId || !row.sectionId) {
          results.skipped++;
          results.errors.push(`Skipped row for ${row.email || "unknown"}: missing fields`);
          continue;
        }

        const existingUser = await User.findOne({ email: row.email });
        if (existingUser) {
          results.skipped++;
          results.errors.push(`Skipped ${row.email}: email already exists`);
          continue;
        }

        const existingAdmission = await Student.findOne({ schoolId, admissionNumber: row.admissionNumber });
        if (existingAdmission) {
          results.skipped++;
          results.errors.push(`Skipped ${row.email}: admission number ${row.admissionNumber} already in use`);
          continue;
        }

        const defaultPassword = await bcrypt.hash("changeme123", 10);
        const user = await User.create({
          name: row.name,
          email: row.email,
          password: defaultPassword,
          role: "STUDENT",
          schoolId,
          isEmailVerified: true,
          mustChangePassword: true,
        });

        await Student.create({
          schoolId,
          userId: user._id,
          admissionNumber: row.admissionNumber,
          classId: row.classId,
          sectionId: row.sectionId,
          classHistory: [{ classId: row.classId, sectionId: row.sectionId, fromDate: new Date() }],
        });

        results.created++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Error on ${row.email}: ${(err as Error).message}`);
      }
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};
