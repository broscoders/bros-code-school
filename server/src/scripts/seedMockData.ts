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
import Invoice from "../models/Invoice";
import Attendance from "../models/Attendance";
import Exam from "../models/Exam";
import Result from "../models/Result";
import Homework from "../models/Homework";
import Assignment from "../models/Assignment";
import Announcement from "../models/Announcement";
import Admission from "../models/Admission";

dotenv.config();

const PASSWORD = "Test@123";
const SCHOOL_ID = "6a7a34b8f4bf247132b2fe3e";

async function ensureUser(name: string, email: string, role: string, schoolId: mongoose.Types.ObjectId) {
  let user = await User.findOne({ email });
  if (user) return user;
  const hashed = await bcrypt.hash(PASSWORD, 10);
  user = await User.create({ name, email, password: hashed, role, schoolId, isEmailVerified: true });
  return user;
}

async function ensureClassSection(schoolId: mongoose.Types.ObjectId, sessionId: mongoose.Types.ObjectId, className: string) {
  let cls = await ClassModel.findOne({ schoolId, sessionId, name: className });
  if (!cls) cls = await ClassModel.create({ schoolId, sessionId, name: className, academicSystem: "Cambridge" });
  let section = await Section.findOne({ schoolId, classId: cls._id, name: "A" });
  if (!section) section = await Section.create({ schoolId, classId: cls._id, name: "A", capacity: 40 });
  return { cls, section };
}

async function ensureSubject(schoolId: mongoose.Types.ObjectId, classId: mongoose.Types.ObjectId, name: string, code: string) {
  let subject = await Subject.findOne({ schoolId, classId, name });
  if (!subject) subject = await Subject.create({ schoolId, classId, name, code });
  return subject;
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const school = await School.findById(SCHOOL_ID);
  if (!school) throw new Error("School not found, run seedTestUsers.ts first");
  const schoolId = school._id as mongoose.Types.ObjectId;

  const session = await AcademicSession.findOne({ schoolId, isActive: true });
  if (!session) throw new Error("No active session, run seedTestUsers.ts first");
  const sessionId = session._id as mongoose.Types.ObjectId;

  console.log("Setting up classes, sections, subjects...");
  const classData: Record<string, any> = {};
  for (const className of ["Grade 9", "Grade 10", "Grade 11"]) {
    const { cls, section } = await ensureClassSection(schoolId, sessionId, className);
    const math = await ensureSubject(schoolId, cls._id as mongoose.Types.ObjectId, "Mathematics", "MATH");
    const eng = await ensureSubject(schoolId, cls._id as mongoose.Types.ObjectId, "English", "ENG");
    const sci = await ensureSubject(schoolId, cls._id as mongoose.Types.ObjectId, "Science", "SCI");
    classData[className] = { cls, section, subjects: [math, eng, sci] };
  }

  console.log("Creating teachers...");
  const teacherNames = [
    { name: "Ayesha Khan", email: "ayesha.khan.demo@test.com" },
    { name: "Ahmed Raza", email: "ahmed.raza.demo@test.com" },
    { name: "Sara Malik", email: "sara.malik.demo@test.com" },
  ];
  const teachers: any[] = [];
  for (let i = 0; i < teacherNames.length; i++) {
    const t = teacherNames[i];
    const user = await ensureUser(t.name, t.email, "TEACHER", schoolId);
    let teacherDoc = await Teacher.findOne({ userId: user._id });
    if (!teacherDoc) {
      teacherDoc = await Teacher.create({
        schoolId,
        userId: user._id,
        employeeId: `EMP-DEMO-${i + 1}`,
        qualification: "M.Ed",
        subjects: [],
        assignedClasses: [],
        joiningDate: new Date(),
        employmentStatus: "ACTIVE",
      });
    }
    teachers.push(teacherDoc);
  }

  console.log("Creating students + parents...");
  const studentFirstNames = [
    "Ali", "Fatima", "Hassan", "Zainab", "Bilal", "Ayesha", "Usman", "Mariam",
    "Omar", "Hira", "Hamza", "Noor",
  ];
  const classNames = ["Grade 9", "Grade 10", "Grade 11"];
  const allStudents: any[] = [];
  let parentPool: any[] = [];

  for (let i = 0; i < studentFirstNames.length; i++) {
    const firstName = studentFirstNames[i];
    const className = classNames[i % 3];
    const { cls, section } = classData[className];

    const studentEmail = `${firstName.toLowerCase()}.student.demo@test.com`;
    const studentUser = await ensureUser(`${firstName} Student`, studentEmail, "STUDENT", schoolId);

    let studentDoc = await Student.findOne({ userId: studentUser._id });
    if (!studentDoc) {
      studentDoc = await Student.create({
        schoolId,
        userId: studentUser._id,
        admissionNumber: `ADM-DEMO-${String(i + 1).padStart(3, "0")}`,
        classId: cls._id,
        sectionId: section._id,
        dateOfBirth: new Date(2010 + (i % 4), i % 12, 10),
        gender: i % 2 === 0 ? "Male" : "Female",
        admissionDate: new Date(),
        status: "ACTIVE",
      });
    }

    let parentDoc;
    if (i % 2 === 1 && parentPool.length > 0) {
      parentDoc = parentPool[parentPool.length - 1];
      if (!parentDoc.children.some((c: any) => c.toString() === (studentDoc!._id as any).toString())) {
        parentDoc.children.push(studentDoc._id);
        await parentDoc.save();
      }
    } else {
      const parentEmail = `${firstName.toLowerCase()}.parent.demo@test.com`;
      const parentUser = await ensureUser(`${firstName} Parent`, parentEmail, "PARENT", schoolId);
      parentDoc = await Parent.findOne({ userId: parentUser._id });
      if (!parentDoc) {
        parentDoc = await Parent.create({ schoolId, userId: parentUser._id, children: [studentDoc._id], relationship: "Father" });
      }
      parentPool.push(parentDoc);
    }
    studentDoc.parentId = parentDoc._id as mongoose.Types.ObjectId;
    await studentDoc.save();

    allStudents.push({ studentDoc, className, cls, section, subjects: classData[className].subjects });
  }

  console.log("Assigning teachers to classes/subjects...");
  for (let i = 0; i < classNames.length; i++) {
    const className = classNames[i];
    const teacher = teachers[i % teachers.length];
    const { cls, subjects } = classData[className];
    teacher.assignedClasses = Array.from(new Set([...teacher.assignedClasses.map((c: any) => c.toString()), cls._id.toString()]));
    teacher.subjects = Array.from(new Set([...teacher.subjects.map((s: any) => s.toString()), ...subjects.map((s: any) => s._id.toString())]));
    await teacher.save();
  }

  console.log("Creating fee invoices (mixed statuses)...");
  const feeStatusCycle = ["PAID", "PARTIAL", "PENDING", "OVERDUE"];
  for (let i = 0; i < allStudents.length; i++) {
    const { studentDoc } = allStudents[i];
    const amount = 15000;
    const statusPick = feeStatusCycle[i % 4];
    const existing = await Invoice.findOne({ schoolId, studentId: studentDoc._id, feeType: "Tuition Fee - Term 1" });
    if (existing) continue;

    let paidAmount = 0;
    let status = statusPick;
    let dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    if (statusPick === "PAID") paidAmount = amount;
    else if (statusPick === "PARTIAL") paidAmount = Math.round(amount * 0.4);
    else if (statusPick === "OVERDUE") {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() - 10);
    }

    await Invoice.create({
      schoolId,
      studentId: studentDoc._id,
      feeType: "Tuition Fee - Term 1",
      amount,
      paidAmount,
      status,
      dueDate,
      paidDate: status === "PAID" ? new Date() : undefined,
    });
  }

  console.log("Creating attendance for the last 3 school days...");
  for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    for (const { studentDoc, cls, section } of allStudents) {
      const roll = Math.random();
      const status = roll > 0.85 ? "ABSENT" : roll > 0.78 ? "LATE" : "PRESENT";
      const exists = await Attendance.findOne({ studentId: studentDoc._id, date });
      if (exists) continue;
      await Attendance.create({
        schoolId,
        studentId: studentDoc._id,
        classId: cls._id,
        sectionId: section._id,
        date,
        status,
      });
    }
  }

  console.log("Creating exams + results...");
  for (const className of classNames) {
    const { cls, section, subjects } = classData[className];
    const mathSubject = subjects[0];
    let exam = await Exam.findOne({ schoolId, classId: cls._id, name: "Mid Term Exam" });
    if (!exam) {
      exam = await Exam.create({
        schoolId,
        classId: cls._id,
        sectionId: section._id,
        subjectId: mathSubject._id,
        name: "Mid Term Exam",
        examType: "MIDTERM",
        date: new Date(),
        totalMarks: 100,
      });
    }
    const studentsInClass = allStudents.filter((s) => s.className === className);
    for (const { studentDoc } of studentsInClass) {
      const existingResult = await Result.findOne({ examId: exam._id, studentId: studentDoc._id });
      if (existingResult) continue;
      const marks = 55 + Math.floor(Math.random() * 40);
      const grade = marks >= 90 ? "A+" : marks >= 80 ? "A" : marks >= 70 ? "B" : marks >= 60 ? "C" : "D";
      await Result.create({ schoolId, examId: exam._id, studentId: studentDoc._id, marksObtained: marks, grade, isPublished: true });
    }
  }

  console.log("Creating homework, assignments, announcements...");
  const adminUser = await User.findOne({ role: "SCHOOL_ADMIN", schoolId });
  for (const className of classNames) {
    const { cls, section, subjects } = classData[className];
    const teacher = teachers[classNames.indexOf(className) % teachers.length];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const hwExists = await Homework.findOne({ schoolId, classId: cls._id, title: "Chapter 3 Exercise" });
    if (!hwExists) {
      await Homework.create({
        schoolId,
        classId: cls._id,
        sectionId: section._id,
        subjectId: subjects[0]._id,
        teacherId: teacher._id,
        title: "Chapter 3 Exercise",
        description: "Complete all questions from Chapter 3, pages 45-48.",
        dueDate,
      });
    }

    const asgExists = await Assignment.findOne({ schoolId, classId: cls._id, title: "Research Project" });
    if (!asgExists) {
      await Assignment.create({
        schoolId,
        classId: cls._id,
        sectionId: section._id,
        subjectId: subjects[1]._id,
        teacherId: teacher._id,
        title: "Research Project",
        instructions: "Prepare a 2-page report on a topic of your choice related to this term's syllabus.",
        totalMarks: 20,
        dueDate,
      });
    }
  }

  if (adminUser) {
    const annExists = await Announcement.findOne({ schoolId, title: "Welcome to the new term!" });
    if (!annExists) {
      await Announcement.create({
        schoolId,
        title: "Welcome to the new term!",
        message: "We are excited to start this new academic term. Please check your timetables and be on time.",
        targetAudience: "ALL",
        createdBy: adminUser._id,
      });
    }
    const annExists2 = await Announcement.findOne({ schoolId, title: "Fee due date reminder" });
    if (!annExists2) {
      await Announcement.create({
        schoolId,
        title: "Fee due date reminder",
        message: "Please clear pending tuition fees before the due date to avoid late charges.",
        targetAudience: "PARENTS",
        createdBy: adminUser._id,
      });
    }
  }

  console.log("Creating sample admissions pipeline...");
  const admissionSamples = [
    { applicantName: "Zara Ahmed", parentName: "Ahmed Sheikh", parentContact: "0300-1111111", status: "APPLICATION" },
    { applicantName: "Danish Iqbal", parentName: "Iqbal Rehman", parentContact: "0300-2222222", status: "REVIEW" },
    { applicantName: "Sana Tariq", parentName: "Tariq Mehmood", parentContact: "0300-3333333", status: "APPROVED" },
  ];
  const grade9Class = classData["Grade 9"].cls;
  for (const a of admissionSamples) {
    const exists = await Admission.findOne({ schoolId, applicantName: a.applicantName });
    if (exists) continue;
    await Admission.create({
      schoolId,
      applicantName: a.applicantName,
      parentName: a.parentName,
      parentContact: a.parentContact,
      desiredClassId: grade9Class._id,
      academicSystem: "Cambridge",
      status: a.status,
    });
  }

  console.log("\n=== DONE ===");
  console.log(`Classes: Grade 9, 10, 11 (Section A each)`);
  console.log(`Teachers: ${teachers.length} (password: ${PASSWORD})`);
  console.log(`Students: ${allStudents.length} (password: ${PASSWORD})`);
  console.log(`Parents: ${parentPool.length} (password: ${PASSWORD})`);
  console.log(`Fee invoices: mixed PAID / PARTIAL / PENDING / OVERDUE`);
  console.log(`Attendance: last 3 days for all students`);
  console.log(`Exams: 1 Mid Term per class with published results`);
  console.log(`Homework + Assignment: 1 each per class`);
  console.log(`Announcements: 2`);
  console.log(`Admissions: 3 (APPLICATION, REVIEW, APPROVED - try converting the APPROVED one)`);
  console.log("\nAll demo accounts use password: " + PASSWORD);

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});