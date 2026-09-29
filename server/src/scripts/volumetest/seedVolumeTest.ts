/**
 * Bro's Code - CAPACITY / VOLUME TEST
 *
 * Adds a large, growing amount of data to ONE EXISTING school (the same
 * school your other seed scripts use) so you can watch, live, how much data
 * fits in your MongoDB Atlas plan (M0 free tier = 512 MB total).
 *
 * Safety, by design:
 *  - Only ADDS new documents. It never edits or deletes a real student,
 *    invoice, class, etc. It creates its OWN classes/sections/subjects/exams
 *    (named "VolTest ...") and its own students/parents/users, so your real
 *    academic data is never touched or mixed into.
 *  - Every document it creates is tagged so cleanVolumeTest.ts can remove
 *    exactly (and only) what this script added:
 *      - admission numbers starting with "VOLTEST-"
 *      - user emails ending in "@loadtest.broscode.internal"
 *      - class/section/subject/exam names starting with "VolTest"
 *  - Stops itself automatically before the database gets full (default:
 *    stops at 90% of a 512 MB cap = ~460 MB), or after a time limit, or
 *    after a student-count safety cap - whichever comes first.
 *  - Shows the DB host + name and asks you to type CONFIRM before writing.
 *  - Prints the live database size after every batch, so you can literally
 *    watch it climb toward the limit.
 *
 * Run (from the server folder), against your REAL MONGODB_URI in .env:
 *   npx tsx src/scripts/volumetest/seedVolumeTest.ts
 *
 * Options (environment variables), all optional:
 *   SCHOOL_ID=6a7a34b8f4bf247132b2fe3e   which school to add data to
 *                                        (defaults to the id already used by
 *                                        seedMockData.ts / seedMockData2.ts /
 *                                        seedMockData3.ts)
 *   SAFETY_CAP_MB=460                    stop once the DB reaches this size
 *   MAX_MINUTES=25                       stop after this many minutes
 *   MAX_STUDENTS=200000                  hard cap on students, just in case
 *   STUDENTS_PER_BATCH=300               how many students per batch
 *   CLASSES_COUNT=20                     how many synthetic classes to spread
 *                                        students across
 *   ATTENDANCE_DAYS=15                   attendance rows per student
 *   CONFIRM=YES                          skip the interactive prompt (CI use)
 *
 * When you're done looking at the numbers, run:
 *   npx tsx src/scripts/volumetest/cleanVolumeTest.ts
 */
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../../models/User";
import School from "../../models/School";
import AcademicSession from "../../models/AcademicSession";
import ClassModel from "../../models/ClassModel";
import Section from "../../models/Section";
import Subject from "../../models/Subject";
import Teacher from "../../models/Teacher";
import Student from "../../models/Student";
import Parent from "../../models/Parent";
import Invoice from "../../models/Invoice";
import Attendance from "../../models/Attendance";
import Exam from "../../models/Exam";
import Result from "../../models/Result";
import { TAG, PASSWORD, confirmOrExit, dbSizeMB } from "./shared";

dotenv.config();

const DEFAULT_SCHOOL_ID = "6a7a34b8f4bf247132b2fe3e"; // same school seedMockData*.ts use
const SCHOOL_ID = process.env.SCHOOL_ID || DEFAULT_SCHOOL_ID;
const SAFETY_CAP_MB = Number(process.env.SAFETY_CAP_MB || 460); // ~90% of the 512MB M0 cap
const MAX_MINUTES = Number(process.env.MAX_MINUTES || 25);
const MAX_STUDENTS = Number(process.env.MAX_STUDENTS || 200000);
const STUDENTS_PER_BATCH = Number(process.env.STUDENTS_PER_BATCH || 300);
const CLASSES_COUNT = Number(process.env.CLASSES_COUNT || 20);
const ATTENDANCE_DAYS = Number(process.env.ATTENDANCE_DAYS || 15);

const MALE = ["Ahmed", "Ali", "Hassan", "Hussain", "Usman", "Bilal", "Hamza", "Zain", "Faizan", "Awais", "Talha", "Umar", "Saad", "Daniyal", "Ibrahim"];
const FEMALE = ["Ayesha", "Fatima", "Zainab", "Maryam", "Hira", "Sana", "Iqra", "Areeba", "Noor", "Laiba", "Amna", "Mahnoor", "Eman", "Hoorain", "Rida"];
const SURNAMES = ["Khan", "Malik", "Butt", "Sheikh", "Chaudhry", "Qureshi", "Siddiqui", "Raza", "Iqbal", "Hashmi", "Mirza", "Awan"];
const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
const oid = () => new Types.ObjectId();

function weekdaysBack(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setUTCDate(d.getUTCDate() - 1);
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push(new Date(d));
  }
  return out;
}

async function main() {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) { console.error("MONGODB_URI is not set (check server/.env)."); process.exit(1); }
  await confirmOrExit(`ADD load-test data to school ${SCHOOL_ID} until ~${SAFETY_CAP_MB}MB or ${MAX_MINUTES} min`, uri);

  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const school = await School.findById(SCHOOL_ID);
  if (!school) {
    console.error(`\nSchool ${SCHOOL_ID} not found. Run seedTestUsers.ts first, or pass SCHOOL_ID=<id> for an existing school.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  const schoolId = school._id as Types.ObjectId;
  console.log(`Target school: "${school.name}" (${schoolId})`);

  const start0 = await dbSizeMB(db);
  console.log(`Current database size: ${start0.mb >= 0 ? start0.mb.toFixed(1) + " MB" : "unknown (" + start0.source + ")"}`);

  // ---- one-time setup: our own session, classes, sections, subjects, exams,
  // and a single "bot" teacher used only to mark attendance. None of this
  // touches the school's real academic setup.
  let session = await AcademicSession.findOne({ schoolId, name: "VolTest Session" });
  if (!session) session = await AcademicSession.create({ schoolId, name: "VolTest Session", startDate: new Date(), endDate: new Date(Date.now() + 365 * 86400000), isActive: false });

  const botEmail = "voltest.bot@loadtest.broscode.internal";
  let botUser = await User.findOne({ email: botEmail });
  if (!botUser) botUser = await User.create({ name: "VolTest Bot", email: botEmail, password: await bcrypt.hash(PASSWORD, 10), role: "TEACHER", schoolId, isEmailVerified: true, isActive: true, accountStatus: "ACTIVE" });
  const botTeacherExists = await Teacher.findOne({ userId: botUser._id });
  if (!botTeacherExists) await Teacher.create({ schoolId, userId: botUser._id, employeeId: "VOLTEST-BOT", employmentStatus: "ACTIVE" });

  const classes: { classId: Types.ObjectId; sectionId: Types.ObjectId; examId: Types.ObjectId }[] = [];
  for (let i = 0; i < CLASSES_COUNT; i++) {
    const name = `VolTest Grade ${i + 1}`;
    let cls = await ClassModel.findOne({ schoolId, name });
    if (!cls) cls = await ClassModel.create({ schoolId, sessionId: session._id, name, academicSystem: "National" });
    let section = await Section.findOne({ schoolId, classId: cls._id, name: "V1" });
    if (!section) section = await Section.create({ schoolId, classId: cls._id, name: "V1", capacity: MAX_STUDENTS });
    let subject = await Subject.findOne({ schoolId, classId: cls._id, name: "VolTest Subject" });
    if (!subject) subject = await Subject.create({ schoolId, classId: cls._id, name: "VolTest Subject", code: "VLT" + i });
    let exam = await Exam.findOne({ schoolId, classId: cls._id, name: "VolTest Exam" });
    if (!exam) exam = await Exam.create({ schoolId, classId: cls._id, sectionId: section._id, subjectId: subject._id, name: "VolTest Exam", examType: "TEST", date: new Date(), totalMarks: 100 });
    classes.push({ classId: cls._id as Types.ObjectId, sectionId: section._id as Types.ObjectId, examId: exam._id as Types.ObjectId });
  }
  console.log(`Prepared ${classes.length} synthetic classes to enroll students into.\n`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10); // reused for every synthetic user - fast, fine for load data
  const runId = Date.now();
  const attendanceDays = weekdaysBack(ATTENDANCE_DAYS);
  const startedAt = Date.now();

  let totalStudents = 0, totalParents = 0, totalUsers = 0, totalInvoices = 0, totalAttendance = 0, totalResults = 0;
  let batchNum = 0;
  let lastMb = start0.mb;
  let lastParentDoc: any = null; // carries the current family's parent across the odd-i iteration within a batch

  outer: for (;;) {
    batchNum++;
    const elapsedMin = (Date.now() - startedAt) / 60000;
    if (elapsedMin >= MAX_MINUTES) { console.log(`\nStopping: reached the ${MAX_MINUTES}-minute time limit.`); break; }
    if (totalStudents >= MAX_STUDENTS) { console.log(`\nStopping: reached the ${MAX_STUDENTS}-student safety cap.`); break; }
    if (lastMb >= 0 && lastMb >= SAFETY_CAP_MB) { console.log(`\nStopping: database reached ${lastMb.toFixed(1)} MB (safety cap ${SAFETY_CAP_MB} MB).`); break; }

    const users: any[] = [], parents: any[] = [], students: any[] = [], invoices: any[] = [], attendance: any[] = [], results: any[] = [];
    const batchSize = Math.min(STUDENTS_PER_BATCH, MAX_STUDENTS - totalStudents);
    const batchStartCount = totalStudents; // fixed at batch start - globalIdx must not depend on a counter that also changes inside this same loop

    for (let i = 0; i < batchSize; i++) {
      const globalIdx = batchStartCount + i;
      const c = classes[globalIdx % classes.length];
      const female = globalIdx % 2 === 0;
      const first = pick(female ? FEMALE : MALE, globalIdx);
      const surname = pick(SURNAMES, globalIdx * 3 + 7);
      const tag = `${runId}-${globalIdx}`;

      // Two students per family (siblings), one parent account per pair.
      let parentId: Types.ObjectId;
      let currentParentDoc: any;
      if (i % 2 === 0) {
        const pUserId = oid();
        users.push({ _id: pUserId, name: `${pick(MALE, globalIdx + 5)} ${surname}`, email: `parent.${tag}@loadtest.broscode.internal`, password: passwordHash, role: "PARENT", schoolId, isEmailVerified: true, isActive: true, accountStatus: "ACTIVE" });
        totalUsers++;
        parentId = oid();
        currentParentDoc = { _id: parentId, schoolId, userId: pUserId, children: [], relationship: "Father" };
        parents.push(currentParentDoc);
        lastParentDoc = currentParentDoc;
        totalParents++;
      } else {
        currentParentDoc = lastParentDoc;
        parentId = currentParentDoc ? currentParentDoc._id : oid();
      }

      const sUserId = oid();
      users.push({ _id: sUserId, name: `${first} ${surname}`, email: `student.${tag}@loadtest.broscode.internal`, password: passwordHash, role: "STUDENT", schoolId, isEmailVerified: true, isActive: true, accountStatus: "ACTIVE" });
      totalUsers++;
      const sid = oid();
      students.push({
        _id: sid, schoolId, userId: sUserId, admissionNumber: `${TAG}${tag}`, classId: c.classId, sectionId: c.sectionId, parentId,
        gender: female ? "Female" : "Male", address: `Load test address ${globalIdx}`, admissionDate: new Date(), status: "ACTIVE",
        classHistory: [{ classId: c.classId, sectionId: c.sectionId, fromDate: new Date() }],
      });
      const lastParent = currentParentDoc;
      if (lastParent) lastParent.children.push(sid);
      totalStudents++;

      const tuition = 3000 + (globalIdx % 10) * 500;
      for (let m = 0; m < 3; m++) {
        const roll = (globalIdx + m) % 10;
        const due = new Date(2026, 8 + m, 10);
        let status = "PENDING", paid: number | undefined;
        if (roll < 5) { status = "PAID"; paid = tuition; } else if (roll < 7) { status = "PARTIAL"; paid = Math.round(tuition / 2); } else if (due < new Date()) status = "OVERDUE";
        invoices.push({ schoolId, studentId: sid, feeType: `${TAG}Tuition-${m}`, amount: tuition, dueDate: due, status, paidAmount: paid });
      }
      totalInvoices += 3;

      attendanceDays.forEach((d, di) => {
        const r = (globalIdx * 7 + di * 13) % 100;
        attendance.push({ schoolId, studentId: sid, classId: c.classId, sectionId: c.sectionId, date: d, status: r < 88 ? "PRESENT" : r < 95 ? "ABSENT" : "LATE", markedBy: botUser!._id });
      });
      totalAttendance += attendanceDays.length;

      const marks = 35 + ((globalIdx * 17) % 66);
      results.push({ examId: c.examId, studentId: sid, marksObtained: marks, grade: marks >= 80 ? "A" : marks >= 50 ? "B" : "C", isPublished: true, publishedAt: new Date() });
      totalResults++;
    }

    if (users.length) await User.insertMany(users, { ordered: false });
    if (parents.length) await Parent.insertMany(parents, { ordered: false });
    if (students.length) await Student.insertMany(students, { ordered: false });
    if (invoices.length) await Invoice.insertMany(invoices, { ordered: false });
    if (attendance.length) await Attendance.insertMany(attendance, { ordered: false });
    if (results.length) await Result.insertMany(results, { ordered: false });

    const sizeNow = await dbSizeMB(db);
    lastMb = sizeNow.mb;
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(0);
    console.log(
      `[batch ${batchNum}] students so far: ${totalStudents.toLocaleString()} | ` +
      `size: ${sizeNow.mb >= 0 ? sizeNow.mb.toFixed(1) + " MB" : "n/a (" + sizeNow.source + ")"} | ` +
      `elapsed: ${elapsed}s`
    );

    if (batchSize < STUDENTS_PER_BATCH) { console.log("\nStopping: reached the student safety cap mid-batch."); break outer; }
  }

  const finalSize = await dbSizeMB(db);
  console.log("\n==================== SUMMARY ====================");
  console.log(`Students added   : ${totalStudents.toLocaleString()}`);
  console.log(`Parents added    : ${totalParents.toLocaleString()}`);
  console.log(`User accounts    : ${totalUsers.toLocaleString()}`);
  console.log(`Invoices added   : ${totalInvoices.toLocaleString()}`);
  console.log(`Attendance rows  : ${totalAttendance.toLocaleString()}`);
  console.log(`Results added    : ${totalResults.toLocaleString()}`);
  console.log(`Database size    : before ${start0.mb >= 0 ? start0.mb.toFixed(1) + " MB" : "n/a"} -> after ${finalSize.mb >= 0 ? finalSize.mb.toFixed(1) + " MB" : "n/a"}`);
  if (finalSize.mb >= 0 && start0.mb >= 0 && totalStudents > 0) {
    const addedMb = finalSize.mb - start0.mb;
    console.log(`Approx. size per student (with 3 invoices, ${ATTENDANCE_DAYS} attendance rows, 1 result): ${((addedMb * 1024 * 1024) / totalStudents).toFixed(0)} bytes`);
  }
  console.log("\nWhen you're done, run: npx tsx src/scripts/volumetest/cleanVolumeTest.ts");
  await mongoose.disconnect();
}

main().catch((e) => { console.error("VOLUME TEST FAILED:", e); process.exit(1); });
