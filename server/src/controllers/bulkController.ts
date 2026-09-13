import type { Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import School from "../models/School";
import { checkOrgLimit } from "../utils/orgLimits";
import { sendMail, bulkAccountCreatedEmailHtml } from "../utils/mailer";

interface RowInput {
  name: string;
  email: string;
  admissionNumber: string;
  classId: string;
  sectionId: string;
}

interface TeacherRowInput {
  name: string;
  email: string;
  employeeId: string;
  qualification?: string;
}

// A shared "changeme123" password across every bulk-imported account meant
// anyone who could guess the pattern (or read the on-screen hint that used
// to spell it out) could log into a freshly imported student's account
// before the real student ever had - one random password per row instead,
// same as a real invitation would get.
function generateTempPassword(): string {
  return crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "").slice(0, 8) + "!1";
}

export const bulkImportStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { rows, dryRun } = req.body as { rows: RowInput[]; dryRun?: boolean };
    const schoolId = req.user!.schoolId;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ message: "rows array is required" });
    }
    // Blueprint 101: "Never blindly import thousands of records" - a
    // single request importing an unbounded CSV can also just time out a
    // serverless function, so this doubles as a sanity limit either way.
    if (rows.length > 1000) {
      return res.status(400).json({ message: "Import is limited to 1000 rows at a time. Please split your file." });
    }

    const school = await School.findById(schoolId);
    const loginUrl = `${process.env.CLIENT_URL?.split(",")[0] || ""}/login`;
    const results = { created: 0, skipped: 0, errors: [] as string[], accounts: [] as { email: string; tempPassword: string }[] };
    const seenEmailsInBatch = new Set<string>();
    const seenAdmissionNumbersInBatch = new Set<string>();

    for (const row of rows) {
      try {
        if (!row.name || !row.email || !row.admissionNumber || !row.classId || !row.sectionId) {
          results.skipped++;
          results.errors.push(`Skipped row for ${row.email || "unknown"}: missing fields`);
          continue;
        }

        const email = row.email.toLowerCase().trim();

        // Catches duplicates *within the same file* (e.g. the same row
        // pasted twice) - the DB checks below only catch collisions with
        // records that already existed before this import started.
        if (seenEmailsInBatch.has(email)) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: duplicate email within this file`);
          continue;
        }
        if (seenAdmissionNumbersInBatch.has(row.admissionNumber)) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: duplicate admission number within this file`);
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: email already exists`);
          continue;
        }

        const existingAdmission = await Student.findOne({ schoolId, admissionNumber: row.admissionNumber });
        if (existingAdmission) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: admission number ${row.admissionNumber} already in use`);
          continue;
        }

        // Checked per-row (not once before the loop) so the plan limit is
        // enforced against the count as it grows during this same import,
        // not just the count from before the import started.
        const limitCheck = await checkOrgLimit(schoolId, "STUDENT");
        if (!limitCheck.allowed) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: ${limitCheck.message}`);
          continue;
        }

        seenEmailsInBatch.add(email);
        seenAdmissionNumbersInBatch.add(row.admissionNumber);

        // Dry run validates everything above (duplicates, limits, missing
        // fields) without writing anything - the client shows this as a
        // preview and asks for confirmation before calling again for real.
        if (dryRun) {
          results.created++;
          continue;
        }

        const tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const user = await User.create({
          name: row.name,
          email,
          password: hashedPassword,
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
        results.accounts.push({ email, tempPassword });
        sendMail(email, `Your ${school?.name || "school"} account is ready`, bulkAccountCreatedEmailHtml(row.name, email, tempPassword, school?.name || "your school", loginUrl)).catch(() => {});
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

export const bulkImportTeachers = async (req: AuthRequest, res: Response) => {
  try {
    const { rows, dryRun } = req.body as { rows: TeacherRowInput[]; dryRun?: boolean };
    const schoolId = req.user!.schoolId;

    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ message: "rows array is required" });
    }
    if (rows.length > 1000) {
      return res.status(400).json({ message: "Import is limited to 1000 rows at a time. Please split your file." });
    }

    const school = await School.findById(schoolId);
    const loginUrl = `${process.env.CLIENT_URL?.split(",")[0] || ""}/login`;
    const results = { created: 0, skipped: 0, errors: [] as string[], accounts: [] as { email: string; tempPassword: string }[] };
    const seenEmailsInBatch = new Set<string>();
    const seenEmployeeIdsInBatch = new Set<string>();

    for (const row of rows) {
      try {
        if (!row.name || !row.email || !row.employeeId) {
          results.skipped++;
          results.errors.push(`Skipped row for ${row.email || "unknown"}: missing fields`);
          continue;
        }

        const email = row.email.toLowerCase().trim();

        if (seenEmailsInBatch.has(email)) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: duplicate email within this file`);
          continue;
        }
        if (seenEmployeeIdsInBatch.has(row.employeeId)) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: duplicate employee ID within this file`);
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: email already exists`);
          continue;
        }

        const existingEmployee = await Teacher.findOne({ schoolId, employeeId: row.employeeId });
        if (existingEmployee) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: employee ID ${row.employeeId} already in use`);
          continue;
        }

        const limitCheck = await checkOrgLimit(schoolId, "TEACHER");
        if (!limitCheck.allowed) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: ${limitCheck.message}`);
          continue;
        }

        seenEmailsInBatch.add(email);
        seenEmployeeIdsInBatch.add(row.employeeId);

        if (dryRun) {
          results.created++;
          continue;
        }

        const tempPassword = generateTempPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const user = await User.create({
          name: row.name,
          email,
          password: hashedPassword,
          role: "TEACHER",
          schoolId,
          isEmailVerified: true,
          mustChangePassword: true,
        });

        await Teacher.create({
          schoolId,
          userId: user._id,
          employeeId: row.employeeId,
          qualification: row.qualification,
          subjects: [],
          assignedClasses: [],
          joiningDate: new Date(),
          employmentStatus: "ACTIVE",
        });

        results.created++;
        results.accounts.push({ email, tempPassword });
        sendMail(email, `Your ${school?.name || "school"} account is ready`, bulkAccountCreatedEmailHtml(row.name, email, tempPassword, school?.name || "your school", loginUrl)).catch(() => {});
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
