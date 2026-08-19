import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User";
import School from "../models/School";
import AcademicSession from "../models/AcademicSession";
import ClassModel from "../models/ClassModel";
import Section from "../models/Section";
import Subject from "../models/Subject";
import Teacher from "../models/Teacher";
import Student from "../models/Student";
import Parent from "../models/Parent";
import { sendMail, generateSixDigitCode, verificationEmailHtml } from "../utils/mailer";

dotenv.config();

const TEST_PASSWORD = "Test@123";
const SCHOOL_ID = "6a7a34b8f4bf247132b2fe3e";

async function upsertVerifiedFalseUser(name: string, email: string, role: string, schoolId: mongoose.Types.ObjectId) {
  await User.findOneAndDelete({ email });
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const code = generateSixDigitCode();
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    schoolId,
    isEmailVerified: false,
    verificationCode: code,
    verificationCodeExpires: new Date(Date.now() + 15 * 60 * 1000),
  });
  await sendMail(email, "Verify your email", verificationEmailHtml(name, code));
  console.log("  -> " + role + " user created: " + email + " (verification code emailed)");
  return user;
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  let school = await School.findById(SCHOOL_ID);
  if (!school) {
    school = await School.create({ _id: new mongoose.Types.ObjectId(SCHOOL_ID), name: "Bros Code School" });
    console.log("School created:", school._id);
  } else {
    console.log("Using existing school:", school.name);
  }
  const schoolId = school._id as mongoose.Types.ObjectId;

  let session = await AcademicSession.findOne({ schoolId, isActive: true });
  if (!session) {
    session = await AcademicSession.create({
      schoolId,
      name: "2025-2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-06-30"),
      isActive: true,
    });
    console.log("Academic session created:", session.name);
  } else {
    console.log("Using existing academic session:", session.name);
  }
  const sessionId = session._id as mongoose.Types.ObjectId;

  let cls = await ClassModel.findOne({ schoolId, sessionId, name: "Grade 9" });
  if (!cls) {
    cls = await ClassModel.create({ schoolId, sessionId, name: "Grade 9", academicSystem: "Cambridge" });
    console.log("Class created: Grade 9");
  }
  let section = await Section.findOne({ schoolId, classId: cls._id, name: "A" });
  if (!section) {
    section = await Section.create({ schoolId, classId: cls._id, name: "A", capacity: 40 });
    console.log("Section created: Grade 9 - A");
  }
  let subject = await Subject.findOne({ schoolId, classId: cls._id, name: "Mathematics" });
  if (!subject) {
    subject = await Subject.create({ schoolId, classId: cls._id, name: "Mathematics", code: "MATH9" });
    console.log("Subject created: Mathematics");
  }

  let cls2 = await ClassModel.findOne({ schoolId, sessionId, name: "Grade 10" });
  if (!cls2) {
    cls2 = await ClassModel.create({ schoolId, sessionId, name: "Grade 10", academicSystem: "Cambridge" });
    console.log("Class created: Grade 10");
  }
  let section2 = await Section.findOne({ schoolId, classId: cls2._id, name: "A" });
  if (!section2) {
    section2 = await Section.create({ schoolId, classId: cls2._id, name: "A", capacity: 40 });
    console.log("Section created: Grade 10 - A");
  }

  console.log("");
  console.log("Creating test users...");

  const teacherUser = await upsertVerifiedFalseUser("Test Teacher", "bsft25030@itu.edu.pk", "TEACHER", schoolId);
  await Teacher.findOneAndDelete({ userId: teacherUser._id });
  await Teacher.create({
    schoolId,
    userId: teacherUser._id,
    employeeId: "EMP-0001",
    qualification: "M.Sc. Mathematics",
    subjects: [subject._id],
    assignedClasses: [cls._id],
    joiningDate: new Date(),
    employmentStatus: "ACTIVE",
  });
  console.log("  -> Teacher profile linked");

  const studentUser = await upsertVerifiedFalseUser("Test Student", "tailorstory4@gmail.com", "STUDENT", schoolId);
  await Student.findOneAndDelete({ userId: studentUser._id });
  const studentDoc = await Student.create({
    schoolId,
    userId: studentUser._id,
    admissionNumber: "ADM-0001",
    classId: cls._id,
    sectionId: section._id,
    dateOfBirth: new Date("2011-05-14"),
    gender: "Male",
    admissionDate: new Date(),
    status: "ACTIVE",
  });
  console.log("  -> Student profile linked (Grade 9 - A)");

  const parentUser = await upsertVerifiedFalseUser("Test Parent", "hafizdaniyl17@gmail.com", "PARENT", schoolId);
  await Parent.findOneAndDelete({ userId: parentUser._id });
  const parentDoc = await Parent.create({
    schoolId,
    userId: parentUser._id,
    children: [studentDoc._id],
    relationship: "Father",
  });
  console.log("  -> Parent profile linked (child: Test Student)");

  studentDoc.parentId = parentDoc._id as mongoose.Types.ObjectId;
  await studentDoc.save();

  console.log("");
  console.log("Done. All passwords: " + TEST_PASSWORD);
  console.log("Teacher: bsft25030@itu.edu.pk");
  console.log("Student: tailorstory4@gmail.com");
  console.log("Parent:  hafizdaniyl17@gmail.com");
  console.log("");
  console.log("Check each inbox for the verification code, verify at /verify-email, then login.");

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});