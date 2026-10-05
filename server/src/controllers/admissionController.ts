import type { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { AuthRequest } from "../middleware/authMiddleware";
import Admission from "../models/Admission";
import User from "../models/User";
import Student from "../models/Student";
import Parent from "../models/Parent";
import Section from "../models/Section";
import ClassModel from "../models/ClassModel";
import { sendMail, generateSixDigitCode, verificationEmailHtml } from "../utils/mailer";
import { checkOrgLimit } from "../utils/orgLimits";

const CODE_EXPIRY_MS = 15 * 60 * 1000;

// Matches bulkController's generator - Math.random().toString(36) isn't
// cryptographically secure and its skewed character distribution makes
// weaker passwords than they look, which matters for accounts an admin is
// choosing on someone else's behalf.
function generateTempPassword(): string {
  return crypto.randomBytes(6).toString("base64").replace(/[+/=]/g, "").slice(0, 8) + "!1";
}

const ADMISSION_STATUSES = ["APPLICATION", "REVIEW", "INTERVIEW", "APPROVED", "REJECTED", "CONVERTED"];

export const createAdmission = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { applicantName, parentName, parentContact, desiredClassId, academicSystem, documents, notes } = req.body;
    if (!applicantName || !parentName || !parentContact || !desiredClassId || !academicSystem) {
      return res.status(400).json({ message: "Applicant name, parent name, parent contact, class and academic system are required" });
    }
    if (!(await ClassModel.exists({ _id: desiredClassId, schoolId }))) {
      return res.status(404).json({ message: "Selected class not found in your school" });
    }
    // status always starts at APPLICATION - the client can no longer create an
    // admission that is already APPROVED/CONVERTED
    const item = await Admission.create({
      schoolId,
      applicantName: String(applicantName).trim(),
      parentName: String(parentName).trim(),
      parentContact: String(parentContact).trim(),
      desiredClassId,
      academicSystem,
      documents: Array.isArray(documents) ? documents : undefined,
      notes,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const getAdmissions = async (req: AuthRequest, res: Response) => {
  try {
    const list = await Admission.find({ schoolId: req.user!.schoolId });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

export const updateAdmissionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const status = req.body.status;
    if (!ADMISSION_STATUSES.includes(status)) return res.status(400).json({ message: "Invalid status" });
    if (status === "CONVERTED") {
      return res.status(400).json({ message: "Use the convert-to-student endpoint to complete admission" });
    }
    const existing = await Admission.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!existing) return res.status(404).json({ message: "Admission not found" });
    if (existing.status === "CONVERTED") {
      return res.status(400).json({ message: "This admission is already converted to a student and can't be changed" });
    }
    existing.status = status;
    await existing.save();
    res.json(existing);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};

// Blueprint core workflow: Admission approved -> Student record created ->
// parent relationship created -> class assignment done, all in one step.
export const convertAdmissionToStudent = async (req: AuthRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const admission = await Admission.findOne({ _id: req.params.id, schoolId });
    if (!admission) return res.status(404).json({ message: "Admission not found" });
    if (admission.status !== "APPROVED") {
      return res.status(400).json({ message: "Only approved admissions can be converted to a student record" });
    }

    const { dateOfBirth, gender, sectionId } = req.body;
    const admissionNumber = String(req.body.admissionNumber || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const parentEmail = String(req.body.parentEmail || "").trim().toLowerCase();
    if (!email || !parentEmail || !dateOfBirth || !gender || !admissionNumber || !sectionId) {
      return res.status(400).json({ message: "Student email, parent email, date of birth, gender, admission number and section are required" });
    }
    const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!emailOk(email) || !emailOk(parentEmail)) return res.status(400).json({ message: "Please enter valid email addresses" });
    if (email === parentEmail) return res.status(400).json({ message: "Student and parent need different email addresses" });

    // Student.sectionId is required, but this used to be optional here: the
    // student LOGIN account was created first and then the profile failed,
    // leaving an orphan account whose email blocked every retry.
    const section = await Section.findOne({ _id: sectionId, classId: admission.desiredClassId, schoolId });
    if (!section) return res.status(400).json({ message: "Please choose a section of the class this student applied for" });
    if (section.capacity) {
      const taken = await Student.countDocuments({ sectionId, schoolId, status: "ACTIVE" });
      if (taken >= section.capacity) return res.status(400).json({ message: `Section "${section.name}" is full (${section.capacity} students)` });
    }
    // a parent email that already belongs to a non-parent (e.g. a teacher) must not receive a child
    const existingParentUser = await User.findOne({ email: parentEmail });
    if (existingParentUser && (existingParentUser.role !== "PARENT" || existingParentUser.schoolId.toString() !== schoolId)) {
      return res.status(400).json({ message: "This parent email already belongs to a non-parent account" });
    }

    const existingStudentUser = await User.findOne({ email });
    if (existingStudentUser) {
      return res.status(400).json({ message: "A user with this student email already exists" });
    }

    const existingAdmissionNo = await Student.findOne({ schoolId, admissionNumber });
    if (existingAdmissionNo) {
      return res.status(400).json({ message: "This admission number is already in use" });
    }

    const limitCheck = await checkOrgLimit(schoolId, "STUDENT");
    if (!limitCheck.allowed) {
      return res.status(403).json({ message: limitCheck.message });
    }

    const createdUserIds: any[] = [];
    let createdStudentId: any = null;
    let createdParentId: any = null;
    let tempPassword = "";
    let studentCode = "";
    let parentTempPassword: string | null = null;
    let parentCode: string | null = null;
    let student: any;
    try {
    // 1. Student user account
    tempPassword = generateTempPassword();
    const studentHashed = await bcrypt.hash(tempPassword, 10);
    studentCode = generateSixDigitCode();
    const studentUser = await User.create({
      name: admission.applicantName,
      email,
      password: studentHashed,
      role: "STUDENT",
      schoolId,
      isEmailVerified: false,
      mustChangePassword: true,
      verificationCode: studentCode,
      verificationCodeExpires: new Date(Date.now() + CODE_EXPIRY_MS),
    });
    createdUserIds.push(studentUser._id);

    // 2. Student academic record
    student = await Student.create({
      schoolId,
      userId: studentUser._id,
      admissionNumber,
      classId: admission.desiredClassId,
      sectionId,
      dateOfBirth,
      gender,
      admissionDate: new Date(),
      status: "ACTIVE",
      classHistory: [{ classId: admission.desiredClassId, sectionId, fromDate: new Date() }],
    });
    createdStudentId = student._id;

    // 3. Parent account - reuse if this parent already has an account (sibling admission)
    let parentUser: any = existingParentUser;
    let parentDoc;

    if (parentUser) {
      parentDoc = await Parent.findOne({ userId: parentUser._id, schoolId });
      if (parentDoc) {
        parentDoc.children.push(student._id);
        await parentDoc.save();
      } else {
        parentDoc = await Parent.create({ schoolId, userId: parentUser._id, children: [student._id], relationship: "Guardian" });
      }
    } else {
      parentTempPassword = generateTempPassword();
      const parentHashed = await bcrypt.hash(parentTempPassword, 10);
      parentCode = generateSixDigitCode();
      parentUser = await User.create({
        name: admission.parentName,
        email: parentEmail,
        password: parentHashed,
        role: "PARENT",
        schoolId,
        isEmailVerified: false,
        mustChangePassword: true,
        verificationCode: parentCode,
        verificationCodeExpires: new Date(Date.now() + CODE_EXPIRY_MS),
      });
      createdUserIds.push(parentUser._id);
      parentDoc = await Parent.create({ schoolId, userId: parentUser._id, children: [student._id], relationship: "Guardian" });
      createdParentId = parentDoc._id;
    }

    student.parentId = parentDoc._id;
    await student.save();

    admission.status = "CONVERTED";
    await admission.save();
    } catch (convErr) {
      // roll back whatever was created so the admission can simply be retried
      if (createdStudentId) await Student.deleteOne({ _id: createdStudentId }).catch(() => {});
      if (createdParentId) await Parent.deleteOne({ _id: createdParentId }).catch(() => {});
      if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } }).catch(() => {});
      throw convErr;
    }

    // Notify both new accounts with their verification code / temp password
    await sendMail(
      email,
      "Welcome! Your student account is ready",
      verificationEmailHtml(admission.applicantName, studentCode) +
        `<p>Your temporary password is: <strong>${tempPassword}</strong>. Please change it after logging in.</p>`,
      schoolId
    );

    if (parentTempPassword) {
      // Bug fix: this used to call generateSixDigitCode() again here,
      // which meant the code shown in the parent's welcome email could
      // never match parentCode (the one actually saved on their User
      // record above) - the parent had no way to verify their email with
      // the code they were sent.
      await sendMail(
        parentEmail,
        "Welcome! Your parent account is ready",
        verificationEmailHtml(admission.parentName, parentCode!) +
          `<p>Your temporary password is: <strong>${parentTempPassword}</strong>. Please change it after logging in.</p>`,
        schoolId
      );
    }

    res.status(201).json({
      message: "Admission converted to student successfully",
      student,
      studentAccountCreated: true,
      parentAccountCreated: !!parentTempPassword,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: (err as Error).message });
  }
};