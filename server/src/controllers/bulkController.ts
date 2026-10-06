import type { Response } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Student from "../models/Student";
import Teacher from "../models/Teacher";
import School from "../models/School";
import { checkOrgLimit } from "../utils/orgLimits";
import Section from "../models/Section";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// CSV cells can arrive as numbers (e.g. an admission number 1042) or with
// stray spaces - normalise to trimmed strings before comparing/saving.
const str = (v: unknown) => (v === undefined || v === null ? "" : String(v).trim());

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

    // Every class/section id in the file must really exist in THIS school and
    // the section must belong to the class. It used to trust the CSV blindly,
    // so a typo (or another school's id) created a student with a dangling
    // or foreign class that then never appeared anywhere.
    const schoolSections = await Section.find({ schoolId }).select("_id classId capacity");
    const sectionInfo = new Map(schoolSections.map((sec) => [sec._id.toString(), sec]));
    const seatsTaken = new Map<string, number>();
    const seatsFor = async (sectionId: string) => {
      if (!seatsTaken.has(sectionId)) seatsTaken.set(sectionId, await Student.countDocuments({ schoolId, sectionId, status: "ACTIVE" }));
      return seatsTaken.get(sectionId)!;
    };

    for (const raw of rows) {
      const row: RowInput = {
        name: str(raw?.name),
        email: str(raw?.email),
        admissionNumber: str(raw?.admissionNumber),
        classId: str(raw?.classId),
        sectionId: str(raw?.sectionId),
      };
      try {
        if (!row.name || !row.email || !row.admissionNumber || !row.classId || !row.sectionId) {
          results.skipped++;
          results.errors.push(`Skipped row for ${row.email || "unknown"}: missing fields`);
          continue;
        }

        const email = row.email.toLowerCase();
        if (!EMAIL_RE.test(email)) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: not a valid email address`);
          continue;
        }
        const sec = sectionInfo.get(row.sectionId);
        if (!sec || sec.classId.toString() !== row.classId) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: class/section not found in your school (or the section is not in that class)`);
          continue;
        }
        if (sec.capacity && (await seatsFor(row.sectionId)) >= sec.capacity) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: section is full (${sec.capacity} students)`);
          continue;
        }

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
        seatsTaken.set(row.sectionId, (await seatsFor(row.sectionId)) + 1);

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

        try {
          await Student.create({
            schoolId,
            userId: user._id,
            admissionNumber: row.admissionNumber,
            classId: row.classId,
            sectionId: row.sectionId,
            classHistory: [{ classId: row.classId, sectionId: row.sectionId, fromDate: new Date() }],
          });
        } catch (profileErr) {
          // don't leave a login account without a student profile - its email
          // would block this row on every retry ("email already exists")
          await User.deleteOne({ _id: user._id }).catch(() => {});
          throw profileErr;
        }

        results.created++;
        results.accounts.push({ email, tempPassword });
        sendMail(email, `Your ${school?.name || "school"} account is ready`, bulkAccountCreatedEmailHtml(row.name, email, tempPassword, school?.name || "your school", loginUrl), schoolId).catch(() => {});
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

    for (const raw of rows) {
      const row: TeacherRowInput = {
        name: str(raw?.name),
        email: str(raw?.email),
        employeeId: str(raw?.employeeId),
        qualification: str(raw?.qualification) || undefined,
      };
      try {
        if (!row.name || !row.email || !row.employeeId) {
          results.skipped++;
          results.errors.push(`Skipped row for ${row.email || "unknown"}: missing fields`);
          continue;
        }

        const email = row.email.toLowerCase();
        if (!EMAIL_RE.test(email)) {
          results.skipped++;
          results.errors.push(`Skipped ${email}: not a valid email address`);
          continue;
        }

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

        try {
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
        } catch (profileErr) {
          await User.deleteOne({ _id: user._id }).catch(() => {});
          throw profileErr;
        }

        results.created++;
        results.accounts.push({ email, tempPassword });
        sendMail(email, `Your ${school?.name || "school"} account is ready`, bulkAccountCreatedEmailHtml(row.name, email, tempPassword, school?.name || "your school", loginUrl), schoolId).catch(() => {});
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
