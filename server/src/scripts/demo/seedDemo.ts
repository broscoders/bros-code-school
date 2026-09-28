/**
 * Bro's Code - DEMO DATA SEEDER
 *
 * Creates several fully-populated DEMO schools (default 3 schools x 600 students)
 * so you can demo the product AND test that one school can never see another
 * school's data (see leakTest.ts).
 *
 * Safe by design:
 *  - every school is named "DEMO - ..." ; cleanDemo.ts removes only those
 *  - refuses to run if demo schools already exist (run cleanDemo first)
 *  - shows the DB host + name and requires you to type CONFIRM
 *  - never touches any existing school
 *
 * Run (from the server folder):
 *   npx tsx src/scripts/demo/seedDemo.ts
 * Options (environment variables):
 *   DEMO_SCHOOLS=3   DEMO_STUDENTS=600
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
import Homework from "../../models/Homework";
import Assignment from "../../models/Assignment";
import Announcement from "../../models/Announcement";
import Event from "../../models/Event";
import Admission from "../../models/Admission";
import { DEMO_PREFIX, DEMO_PASSWORD, emailDomain, confirmOrExit } from "./demoShared";

dotenv.config();

const SCHOOLS = Number(process.env.DEMO_SCHOOLS || 3);
const STUDENTS = Number(process.env.DEMO_STUDENTS || 600);

const MALE = ["Ahmed", "Ali", "Hassan", "Hussain", "Usman", "Bilal", "Hamza", "Zain", "Faizan", "Awais", "Talha", "Umar", "Saad", "Daniyal", "Ibrahim", "Ayaan", "Rayyan", "Shahzaib", "Arham", "Moiz"];
const FEMALE = ["Ayesha", "Fatima", "Zainab", "Maryam", "Hira", "Sana", "Iqra", "Areeba", "Noor", "Laiba", "Amna", "Mahnoor", "Eman", "Hoorain", "Rida", "Sidra", "Alishba", "Minahil", "Anaya", "Kiran"];
const SURNAMES = ["Khan", "Malik", "Butt", "Sheikh", "Chaudhry", "Qureshi", "Siddiqui", "Raza", "Iqbal", "Hashmi", "Mirza", "Awan", "Baig", "Gill", "Rana", "Javed", "Farooq", "Ansari", "Bhatti", "Cheema"];
const SUBJECTS = ["English", "Urdu", "Mathematics", "Science", "Islamiat", "Social Studies"];
const STAFF_ROLES: [string, string][] = [
  ["PRINCIPAL", "principal"], ["ACCOUNTANT", "accountant"], ["RECEPTIONIST", "receptionist"], ["LIBRARIAN", "librarian"],
  ["TRANSPORT_MANAGER", "transport"], ["NURSE", "nurse"], ["HOSTEL_WARDEN", "warden"], ["ADMISSION_STAFF", "admissions"],
  ["ACADEMIC_COORDINATOR", "coordinator"], ["HEAD", "head"],
];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
const rnd = (n: number) => Math.floor(Math.random() * n);
const phone = (seed: number) => `03${(10 + (seed % 40)).toString()}${(1000000 + ((seed * 7919) % 8999999)).toString()}`;
const oid = () => new Types.ObjectId();

async function chunkInsert(model: any, docs: any[], size = 1000) {
  for (let i = 0; i < docs.length; i += size) await model.insertMany(docs.slice(i, i + size), { ordered: false });
}

function weekdaysBack(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setUTCDate(d.getUTCDate() - 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
  }
  return out;
}

async function seedSchool(k: number, passwordHash: string) {
  const domain = emailDomain(k);
  const school = await School.create({ name: `${DEMO_PREFIX}School ${k}`, contactEmail: `office@${domain}`, contactPhone: "0421234567" });
  const schoolId = school._id as Types.ObjectId;
  const session = await AcademicSession.create({ schoolId, name: "2026-2027", startDate: new Date("2026-08-01"), endDate: new Date("2027-06-30"), isActive: true });
  const sessionId = session._id as Types.ObjectId;

  // ---- classes, sections, subjects (Grade 1..10, sections A/B)
  const classes: any[] = [], sections: any[] = [], subjects: any[] = [];
  for (let g = 1; g <= 10; g++) {
    const c = { _id: oid(), schoolId, sessionId, name: `Grade ${g}`, academicSystem: "National" };
    classes.push(c);
    for (const s of ["A", "B"]) sections.push({ _id: oid(), schoolId, classId: c._id, name: s, capacity: 45 });
    for (const sub of SUBJECTS) subjects.push({ _id: oid(), schoolId, classId: c._id, name: sub, code: sub.slice(0, 3).toUpperCase() + g });
  }
  await ClassModel.insertMany(classes);
  await Section.insertMany(sections);
  await Subject.insertMany(subjects);

  // ---- users: admin + staff
  const users: any[] = [];
  const mkUser = (name: string, email: string, role: string, ph?: string) => {
    const u = { _id: oid(), name, email, phone: ph, password: passwordHash, role, schoolId, isEmailVerified: true, mustChangePassword: false, isActive: true, accountStatus: "ACTIVE" };
    users.push(u);
    return u;
  };
  const admin = mkUser(`Admin (School ${k})`, `admin@${domain}`, "SCHOOL_ADMIN", phone(k));
  for (const [role, slug] of STAFF_ROLES) mkUser(`${slug[0].toUpperCase() + slug.slice(1)} (School ${k})`, `${slug}@${domain}`, role, phone(k + slug.length));

  // ---- teachers: 3 per class (30 total), each assigned to their class
  const teachers: any[] = [];
  let tn = 0;
  for (const c of classes) {
    const subs = subjects.filter((s) => String(s.classId) === String(c._id));
    for (let i = 0; i < 3; i++) {
      tn++;
      const first = pick(tn % 2 ? MALE : FEMALE, tn * 3);
      const u = mkUser(`${tn % 2 ? "Sir" : "Miss"} ${first} ${pick(SURNAMES, tn)}`, `teacher${tn}@${domain}`, "TEACHER", phone(tn * 13));
      teachers.push({ _id: oid(), schoolId, userId: u._id, employeeId: `S${k}-T${tn}`, qualification: pick(["BS", "MSc", "M.Ed", "MA"], tn), subjects: subs.slice(i * 2, i * 2 + 2).map((s) => s._id), assignedClasses: [c._id], employmentStatus: "ACTIVE" });
    }
  }

  // ---- families and students
  const students: any[] = [], parents: any[] = [];
  const secIds = sections.map((s) => s);
  let studentNo = 0, familyNo = 0;
  while (studentNo < STUDENTS) {
    familyNo++;
    const surname = pick(SURNAMES, familyNo * 5 + k);
    const kids = 1 + (familyNo % 3 === 0 ? 2 : familyNo % 2); // 1..3 children
    const fatherFirst = pick(MALE, familyNo * 7 + k);
    const pu = mkUser(`${fatherFirst} ${surname}`, `parent${familyNo}@${domain}`, "PARENT", phone(familyNo * 31 + k));
    const childIds: Types.ObjectId[] = [];
    const parentId = oid();
    for (let c = 0; c < kids && studentNo < STUDENTS; c++) {
      studentNo++;
      const female = (studentNo + c) % 2 === 0;
      const first = pick(female ? FEMALE : MALE, studentNo * 11 + k);
      const sec = secIds[(studentNo * 7 + c * 3) % secIds.length];
      const su = mkUser(`${first} ${surname}`, `student${studentNo}@${domain}`, "STUDENT", undefined);
      const sid = oid();
      childIds.push(sid);
      students.push({ _id: sid, schoolId, userId: su._id, admissionNumber: `S${k}-${String(studentNo).padStart(4, "0")}`, classId: sec.classId, sectionId: sec._id, parentId, gender: female ? "Female" : "Male", address: `House ${studentNo}, Block ${pick(["A", "B", "C", "D"], studentNo)}, Lahore`, admissionDate: new Date("2026-08-01"), status: "ACTIVE", classHistory: [{ classId: sec.classId, sectionId: sec._id, fromDate: new Date("2026-08-01") }], schoolHistory: [] });
    }
    parents.push({ _id: parentId, schoolId, userId: pu._id, children: childIds, relationship: "Father" });
  }
  await User.insertMany(users, { ordered: false });
  await Teacher.insertMany(teachers);
  await Parent.insertMany(parents);
  await chunkInsert(Student, students);

  // ---- fees: Admission + 3 months tuition, mixed statuses
  const invoices: any[] = [];
  const now = new Date();
  students.forEach((s, i) => {
    const grade = Number(classes.find((c) => String(c._id) === String(s.classId)).name.split(" ")[1]);
    const tuition = 3000 + grade * 500;
    const months = [new Date("2026-09-10"), new Date("2026-10-10"), new Date("2026-11-10")];
    months.forEach((due, m) => {
      const roll = (i + m * 3) % 10;
      let status = "PENDING", paid = 0, paidDate: Date | undefined;
      if (roll < 5) { status = "PAID"; paid = tuition; paidDate = new Date(due.getTime() - 3 * 86400000); }
      else if (roll < 7) { status = "PARTIAL"; paid = Math.round(tuition / 2); paidDate = new Date(due.getTime() - 86400000); }
      else if (due < now) { status = "OVERDUE"; }
      invoices.push({ schoolId, studentId: s._id, feeType: `Tuition ${due.toLocaleString("en", { month: "short" })}`, amount: tuition, originalAmount: tuition, dueDate: due, status, paidAmount: paid || undefined, paidDate });
    });
    invoices.push({ schoolId, studentId: s._id, feeType: "Admission", amount: 10000, originalAmount: 10000, dueDate: new Date("2026-08-15"), status: "PAID", paidAmount: 10000, paidDate: new Date("2026-08-10") });
  });
  await chunkInsert(Invoice, invoices);

  // ---- attendance: last 20 weekdays
  const teacherUserId = teachers[0].userId;
  const days = weekdaysBack(20);
  const att: any[] = [];
  students.forEach((s, i) => {
    days.forEach((d, di) => {
      const r = (i * 7 + di * 13) % 100;
      att.push({ schoolId, studentId: s._id, classId: s.classId, sectionId: s.sectionId, date: d, status: r < 88 ? "PRESENT" : r < 94 ? "ABSENT" : r < 98 ? "LATE" : "LEAVE", markedBy: teacherUserId });
    });
  });
  await chunkInsert(Attendance, att, 2000);

  // ---- exams + results (one midterm per section per subject; ~85% published)
  const exams: any[] = [], results: any[] = [];
  const studentsBySection = new Map<string, any[]>();
  students.forEach((s) => { const key = String(s.sectionId); (studentsBySection.get(key) || studentsBySection.set(key, []).get(key)!).push(s); });
  for (const sec of sections) {
    const subs = subjects.filter((s) => String(s.classId) === String(sec.classId));
    for (const sub of subs) {
      const exam = { _id: oid(), schoolId, classId: sec.classId, sectionId: sec._id, subjectId: sub._id, name: `Midterm - ${sub.name}`, examType: "MIDTERM", date: new Date("2026-09-20"), totalMarks: 100 };
      exams.push(exam);
      const published = exams.length % 7 !== 0;
      (studentsBySection.get(String(sec._id)) || []).forEach((s, si) => {
        const marks = 35 + ((si * 17 + exams.length * 5) % 66);
        results.push({ examId: exam._id, studentId: s._id, marksObtained: marks, grade: marks >= 80 ? "A" : marks >= 65 ? "B" : marks >= 50 ? "C" : marks >= 40 ? "D" : "F", isPublished: published, publishedAt: published ? new Date("2026-09-25") : undefined });
      });
    }
  }
  await Exam.insertMany(exams);
  await chunkInsert(Result, results, 2000);

  // ---- homework / assignments / notices / events / admission leads
  const homework: any[] = [], assignments: any[] = [];
  sections.forEach((sec, i) => {
    const subs = subjects.filter((s) => String(s.classId) === String(sec.classId));
    const t = teachers.find((t) => String(t.assignedClasses[0]) === String(sec.classId))!;
    for (let h = 0; h < 3; h++) homework.push({ schoolId, classId: sec.classId, sectionId: sec._id, subjectId: subs[h]._id, teacherId: t._id, title: `${subs[h].name} - Exercise ${h + 1}`, description: "Complete the exercise in your notebook.", dueDate: new Date(Date.now() + (h + 1) * 86400000 * 2) });
    for (let a = 0; a < 2; a++) assignments.push({ schoolId, classId: sec.classId, sectionId: sec._id, subjectId: subs[a + 3]._id, teacherId: t._id, title: `${subs[a + 3].name} Assignment ${a + 1}`, instructions: "Submit before the deadline.", totalMarks: 20, dueDate: new Date(Date.now() + (a + 3) * 86400000 * 3) });
  });
  await Homework.insertMany(homework);
  await Assignment.insertMany(assignments);
  await Announcement.insertMany([
    ["Welcome to the new session", "ALL", "NORMAL"], ["Fee submission last date is 10th of every month", "PARENTS", "HIGH"], ["Midterm exams start 20 September", "ALL", "HIGH"],
    ["Staff meeting on Friday 2pm", "TEACHERS", "NORMAL"], ["Winter uniform is now mandatory", "PARENTS", "NORMAL"], ["Sports day next month", "STUDENTS", "NORMAL"],
    ["School closed tomorrow due to weather", "ALL", "URGENT"], ["Parent-teacher meeting schedule announced", "PARENTS", "NORMAL"],
  ].map(([title, aud, pr]) => ({ schoolId, title, message: `${title}. Please check the portal for details.`, targetAudience: aud, priority: pr, createdBy: admin._id })));
  await Event.insertMany([
    ["Midterm Exams", "EXAM", "2026-09-20"], ["Parent-Teacher Meeting", "PTM", "2026-10-05"], ["Sports Day", "SPORTS", "2026-10-25"],
    ["Iqbal Day (holiday)", "HOLIDAY", "2026-11-09"], ["Annual Function", "FUNCTION", "2026-12-15"], ["Science Fair", "COMPETITION", "2026-11-20"],
  ].map(([title, eventType, date]) => ({ schoolId, title, description: `${title} at school`, eventType, date: new Date(date) })));
  await Admission.insertMany(Array.from({ length: 25 }, (_, i) => ({ schoolId, applicantName: `${pick(i % 2 ? MALE : FEMALE, i * 3)} ${pick(SURNAMES, i * 2)}`, parentName: `${pick(MALE, i * 5)} ${pick(SURNAMES, i * 2)}`, parentContact: phone(i * 97 + k), desiredClassId: classes[i % classes.length]._id, academicSystem: "National", status: pick(["APPLICATION", "REVIEW", "INTERVIEW", "APPROVED", "REJECTED"], i), notes: "Demo lead" })));

  return { name: school.name, users: users.length, students: students.length, parents: parents.length, teachers: teachers.length, invoices: invoices.length, attendance: att.length, results: results.length, exams: exams.length };
}

(async () => {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) { console.error("MONGODB_URI is not set (check server/.env)."); process.exit(1); }
  await confirmOrExit(`SEED ${SCHOOLS} demo schools x ${STUDENTS} students`, uri);
  await mongoose.connect(uri);
  const existing = await School.countDocuments({ name: new RegExp("^" + DEMO_PREFIX) });
  if (existing > 0) {
    console.error(`\nFound ${existing} existing demo school(s). Run cleanDemo.ts first, then seed again.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10); // one hash reused for every demo user (fast)
  const t0 = Date.now();
  for (let k = 1; k <= SCHOOLS; k++) {
    const r = await seedSchool(k, hash);
    console.log(`\n[${k}/${SCHOOLS}] ${r.name}`);
    console.log(`   users ${r.users} | students ${r.students} | parents ${r.parents} | teachers ${r.teachers}`);
    console.log(`   invoices ${r.invoices} | attendance ${r.attendance} | exams ${r.exams} | results ${r.results}`);
  }
  console.log(`\nDone in ${Math.round((Date.now() - t0) / 1000)}s.`);
  console.log(`\nDemo logins (password for ALL: ${DEMO_PASSWORD})`);
  for (let k = 1; k <= SCHOOLS; k++) {
    const d = emailDomain(k);
    console.log(`  School ${k}: admin@${d} | accountant@${d} | principal@${d} | teacher1@${d} | parent1@${d} | student1@${d}`);
  }
  console.log("\nNext: run leakTest.ts, and cleanDemo.ts when finished.");
  await mongoose.disconnect();
})().catch((e) => { console.error("SEED FAILED:", e); process.exit(1); });
