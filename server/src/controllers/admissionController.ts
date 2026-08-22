import type { Response } from "express";
import bcrypt from "bcryptjs";
import type { AuthRequest } from "../middleware/authMiddleware";
import Admission from "../models/Admission";
import User from "../models/User";
import Student from "../models/Student";
import Parent from "../models/Parent";
import { sendMail, generateSixDigitCode, verificationEmailHtml } from "../utils/mailer";

const CODE_EXPIRY_MS = 15 * 60 * 1000;

export const createAdmission = async (req: AuthRequest, res: Response) => {
  try {
    const item = await Admission.create({ ...req.body, schoolId: req.user!.schoolId });
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
    if (req.body.status === "CONVERTED") {
      return res.status(400).json({ message: "Use the convert-to-student endpoint to complete admission" });
    }
    const item = await Admission.findOneAndUpdate(
      { _id: req.params.id, schoolId: req.user!.schoolId },
      { status: req.body.status },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Admission not found" });
    res.json(item);
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

    const { email, parentEmail, dateOfBirth, gender, sectionId, admissionNumber } = req.body;
    if (!email || !parentEmail || !dateOfBirth || !gender || !admissionNumber) {
      return res.status(400).json({ message: "email, parentEmail, dateOfBirth, gender and admissionNumber are required" });
    }

    const existingStudentUser = await User.findOne({ email });
    if (existingStudentUser) {
      return res.status(400).json({ message: "A user with this student email already exists" });
    }

    const existingAdmissionNo = await Student.findOne({ schoolId, admissionNumber });
    if (existingAdmissionNo) {
      return res.status(400).json({ message: "This admission number is already in use" });
    }

    // 1. Student user account
    const tempPassword = Math.random().toString(36).slice(-8);
    const studentHashed = await bcrypt.hash(tempPassword, 10);
    const studentCode = generateSixDigitCode();
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

    // 2. Student academic record
    const student = await Student.create({
      schoolId,
      userId: studentUser._id,
      admissionNumber,
      classId: admission.desiredClassId,
      sectionId: sectionId || undefined,
      dateOfBirth,
      gender,
      admissionDate: new Date(),
      status: "ACTIVE",
    });

    // 3. Parent account - reuse if this parent already has an account (sibling admission)
    let parentUser = await User.findOne({ email: parentEmail });
    let parentDoc;
    let parentTempPassword: string | null = null;

    if (parentUser) {
      parentDoc = await Parent.findOne({ userId: parentUser._id, schoolId });
      if (parentDoc) {
        parentDoc.children.push(student._id);
        await parentDoc.save();
      } else {
        parentDoc = await Parent.create({ schoolId, userId: parentUser._id, children: [student._id], relationship: "Guardian" });
      }
    } else {
      parentTempPassword = Math.random().toString(36).slice(-8);
      const parentHashed = await bcrypt.hash(parentTempPassword, 10);
      const parentCode = generateSixDigitCode();
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
      parentDoc = await Parent.create({ schoolId, userId: parentUser._id, children: [student._id], relationship: "Guardian" });
    }

    student.parentId = parentDoc._id;
    await student.save();

    admission.status = "CONVERTED";
    await admission.save();

    // Notify both new accounts with their verification code / temp password
    await sendMail(
      email,
      "Welcome! Your student account is ready",
      verificationEmailHtml(admission.applicantName, studentCode) +
        `<p>Your temporary password is: <strong>${tempPassword}</strong>. Please change it after logging in.</p>`
    );

    if (parentTempPassword) {
      await sendMail(
        parentEmail,
        "Welcome! Your parent account is ready",
        verificationEmailHtml(admission.parentName, generateSixDigitCode()) +
          `<p>Your temporary password is: <strong>${parentTempPassword}</strong>. Please change it after logging in.</p>`
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