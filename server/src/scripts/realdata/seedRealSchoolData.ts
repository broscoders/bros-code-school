/**
 * Bro's Code - FULL DATA SEEDER FOR AN EXISTING (REAL) SCHOOL
 *
 * Same rich dataset as the demo schools (seedDemo.ts) - Grade 1 to 10, two
 * sections each, families with 1-3 kids, fees, attendance, exams/results,
 * homework, assignments, announcements, events, admission leads - but added
 * into ONE EXISTING school instead of creating a brand-new one. Use this
 * when you want your own real school to look fully populated.
 *
 * Safety, by design:
 *  - Reuses a class/section/subject if one with the same name already
 *    exists in that school (so "Grade 9", "Grade 10" etc. from any earlier
 *    seed script are not duplicated) and only creates the ones missing.
 *    Existing students already in a reused class/section are left alone.
 *  - Every person this script creates is tagged, so cleanRealSchoolData.ts
 *    can remove exactly (and only) what it added:
 *      - admission numbers starting with "DC-"
 *      - user emails ending in "@demo.brosschool.local"
 *      - homework/announcement/event titles starting with "[Demo Data]"
 *  - Shows the DB host + name and asks you to type CONFIRM before writing.
 *
 * Run (from the server folder), against your real MONGODB_URI in .env:
 *   npx tsx src/scripts/realdata/seedRealSchoolData.ts
 *
 * Options (environment variables), all optional:
 *   SCHOOL_ID=6a7a34b8f4bf247132b2fe3e   which school to add data to
 *                                        (defaults to the id already used by
 *                                        seedMockData.ts / seedVolumeTest.ts)
 *   STUDENTS=600                         how many students to add in total
 *   ATTENDANCE_DAYS=20                   attendance rows per student
 *   CONFIRM=YES                          skip the interactive prompt
 *
 * When you're done, run:
 *   npx tsx src/scripts/realdata/cleanRealSchoolData.ts
 */
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import School from "../../models/School";
import User from "../../models/User";
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
import { TAG_PREFIX, DOMAIN, CONTENT_TAG, PASSWORD, confirmOrExit } from "./shared";

dotenv.config();

const DEFAULT_SCHOOL_ID = "6a7a34b8f4bf247132b2fe3e"; // same school seedMockData*.ts / seedVolumeTest.ts use
const SCHOOL_ID = process.env.SCHOOL_ID || DEFAULT_SCHOOL_ID;
const STUDENTS = Number(process.env.STUDENTS || 600);
const ATTENDANCE_DAYS = Number(process.env.ATTENDANCE_DAYS || 20);

const MALE = ["Ahmed", "Ali", "Hassan", "Hussain", "Usman", "Bilal", "Hamza", "Zain", "Faizan", "Awais", "Talha", "Umar", "Saad", "Daniyal", "Ibrahim", "Ayaan", "Rayyan", "Shahzaib", "Arham", "Moiz"];
const FEMALE = ["Ayesha", "Fatima", "Zainab", "Maryam", "Hira", "Sana", "Iqra", "Areeba", "Noor", "Laiba", "Amna", "Mahnoor", "Eman", "Hoorain", "Rida", "Sidra", "Alishba", "Minahil", "Anaya", "Kiran"];
const SURNAMES = ["Khan", "Malik", "Butt", "Sheikh", "Chaudhry", "Qureshi", "Siddiqui", "Raza", "Iqbal", "Hashmi", "Mirza", "Awan", "Baig", "Gill", "Rana", "Javed", "Farooq", "Ansari", "Bhatti", "Cheema"];
const SUBJECTS = ["English", "Urdu", "Mathematics", "Science", "Islamiat", "Social Studies"];

const pick = <T,>(arr: T[], i: number) => arr[i % arr.length];
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
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) out.push(new Date(d));
  }
  return out;
}

async function main() {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) { console.error("MONGODB_URI is not set (check server/.env)."); process.exit(1); }
  await confirmOrExit(`ADD ${STUDENTS} students (full dataset) to school ${SCHOOL_ID}`, uri);

  await mongoose.connect(uri);
  const school = await School.findById(SCHOOL_ID);
  if (!school) { console.error(`\nSchool ${SCHOOL_ID} not found. Pass SCHOOL_ID=<id> for an existing school.`); await mongoose.disconnect(); process.exit(1); }
  const schoolId = school._id as Types.ObjectId;
  console.log(`Target school: "${school.name}" (${schoolId})`);

  let session = await AcademicSession.findOne({ schoolId, isActive: true });
  if (!session) session = await AcademicSession.create({ schoolId, name: "2026-2027", startDate: new Date("2026-08-01"), endDate: new Date("2027-06-30"), isActive: true });
  const sessionId = session._id as Types.ObjectId;

  // ---- classes, sections, subjects (Grade 1..10, sections A/B) - REUSE by
  // name if the school already has one (e.g. Grade 9/10/11 from an earlier
  // seed script), only creating what's missing.
  const classes: any[] = [], sections: any[] = [], subjects: any[] = [];
  const newClassIds = new Set<string>(); // only classes THIS run created, for a safe cleanup later
  for (let g = 1; g <= 10; g++) {
    const name = `Grade ${g}`;
    let cls = await ClassModel.findOne({ schoolId, name });
    if (!cls) { cls = await ClassModel.create({ schoolId, sessionId, name, academicSystem: "National" }); newClassIds.add(String(cls._id)); }
    classes.push(cls);
    for (const s of ["A", "B"]) {
      let sec = await Section.findOne({ schoolId, classId: cls._id, name: s });
      if (!sec) sec = await Section.create({ schoolId, classId: cls._id, name: s, capacity: 45 });
      sections.push(sec);
    }
    for (const sub of SUBJECTS) {
      let subject = await Subject.findOne({ schoolId, classId: cls._id, name: sub });
      if (!subject) subject = await Subject.create({ schoolId, classId: cls._id, name: sub, code: sub.slice(0, 3).toUpperCase() + g });
      subjects.push(subject);
    }
  }
  console.log(`Classes ready: ${classes.length} (${newClassIds.size} newly created, ${classes.length - newClassIds.size} reused) x 2 sections each.`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users: any[] = [];
  const mkUser = (name: string, email: string, role: string, ph?: string) => {
    const u: any = { _id: oid(), name, email, phone: ph, password: passwordHash, role, schoolId, isEmailVerified: true, mustChangePassword: false, isActive: true, accountStatus: "ACTIVE" };
    users.push(u);
    return u;
  };

  // ---- teachers: 3 per class (reused classes get NEW extra teachers too,
  // additive only - existing teachers of a reused class are left alone)
  const teachers: any[] = [];
  let tn = 0;
  for (const c of classes) {
    const subs = subjects.filter((s) => String(s.classId) === String(c._id));
    for (let i = 0; i < 3; i++) {
      tn++;
      const first = pick(tn % 2 ? MALE : FEMALE, tn * 3);
      const u = mkUser(`${tn % 2 ? "Sir" : "Miss"} ${first} ${pick(SURNAMES, tn)}`, `teacher${tn}@${DOMAIN}`, "TEACHER", phone(tn * 13));
      teachers.push({ _id: oid(), schoolId, userId: u._id, employeeId: `${TAG_PREFIX}T${tn}`, qualification: pick(["BS", "MSc", "M.Ed", "MA"], tn), subjects: subs.slice(i * 2, i * 2 + 2).map((s) => s._id), assignedClasses: [c._id], employmentStatus: "ACTIVE" });
    }
  }

  // ---- families and students, spread evenly across all class+section slots
  const students: any[] = [], parents: any[] = [];
  let studentNo = 0, familyNo = 0;
  while (studentNo < STUDENTS) {
    familyNo++;
    const surname = pick(SURNAMES, familyNo * 5);
    const kids = 1 + (familyNo % 3 === 0 ? 2 : familyNo % 2); // 1..3 children
    const fatherFirst = pick(MALE, familyNo * 7);
    const pu = mkUser(`${fatherFirst} ${surname}`, `parent${familyNo}@${DOMAIN}`, "PARENT", phone(familyNo * 31));
    const childIds: Types.ObjectId[] = [];
    const parentId = oid();
    for (let c = 0; c < kids && studentNo < STUDENTS; c++) {
      studentNo++;
      const female = (studentNo + c) % 2 === 0;
      const first = pick(female ? FEMALE : MALE, studentNo * 11);
      const sec = sections[(studentNo * 7 + c * 3) % sections.length];
      const su = mkUser(`${first} ${surname}`, `student${studentNo}@${DOMAIN}`, "STUDENT", undefined);
      const sid = oid();
      childIds.push(sid);
      students.push({ _id: sid, schoolId, userId: su._id, admissionNumber: `${TAG_PREFIX}${String(studentNo).padStart(4, "0")}`, classId: sec.classId, sectionId: sec._id, parentId, gender: female ? "Female" : "Male", address: `House ${studentNo}, Block ${pick(["A", "B", "C", "D"], studentNo)}, Lahore`, admissionDate: new Date("2026-08-01"), status: "ACTIVE", classHistory: [{ classId: sec.classId, sectionId: sec._id, fromDate: new Date("2026-08-01") }], schoolHistory: [] });
    }
    parents.push({ _id: parentId, schoolId, userId: pu._id, children: childIds, relationship: "Father" });
  }
  await User.insertMany(users, { ordered: false });
  await Teacher.insertMany(teachers);
  await Parent.insertMany(parents);
  await chunkInsert(Student, students);
  console.log(`Created ${students.length} students in ${parents.length} families, ${teachers.length} teachers, ${users.length} user accounts total.`);

  // ---- fees: Admission + 3 months tuition, mixed statuses
  const invoices: any[] = [];
  const now = new Date();
  students.forEach((s, i) => {
    const grade = Number(classes.find((c) => String(c._id) === String(s.classId))!.name.split(" ")[1]);
    const tuition = 3000 + grade * 500;
    const months = [new Date("2026-09-10"), new Date("2026-10-10"), new Date("2026-11-10")];
    months.forEach((due, m) => {
      const roll = (i + m * 3) % 10;
      let status = "PENDING", paid = 0, paidDate: Date | undefined;
      if (roll < 5) { status = "PAID"; paid = tuition; paidDate = new Date(due.getTime() - 3 * 86400000); }
      else if (roll < 7) { status = "PARTIAL"; paid = Math.round(tuition / 2); paidDate = new Date(due.getTime() - 86400000); }
      else if (due < now) status = "OVERDUE";
      invoices.push({ schoolId, studentId: s._id, feeType: `${TAG_PREFIX}Tuition ${due.toLocaleString("en", { month: "short" })}`, amount: tuition, originalAmount: tuition, dueDate: due, status, paidAmount: paid || undefined, paidDate });
    });
    invoices.push({ schoolId, studentId: s._id, feeType: `${TAG_PREFIX}Admission`, amount: 10000, originalAmount: 10000, dueDate: new Date("2026-08-15"), status: "PAID", paidAmount: 10000, paidDate: new Date("2026-08-10") });
  });
  await chunkInsert(Invoice, invoices);

  // ---- attendance
  const teacherUserId = teachers[0].userId;
  const days = weekdaysBack(ATTENDANCE_DAYS);
  const att: any[] = [];
  students.forEach((s, i) => {
    days.forEach((d, di) => {
      const r = (i * 7 + di * 13) % 100;
      att.push({ schoolId, studentId: s._id, classId: s.classId, sectionId: s.sectionId, date: d, status: r < 88 ? "PRESENT" : r < 94 ? "ABSENT" : r < 98 ? "LATE" : "LEAVE", markedBy: teacherUserId });
    });
  });
  await chunkInsert(Attendance, att, 2000);

  // ---- exams + results (one midterm per section per subject; ~85% published)
  // Exam names are tagged so cleanup only ever removes exams THIS script
  // created, even inside a reused class like Grade 9/10/11.
  const exams: any[] = [], results: any[] = [];
  const studentsBySection = new Map<string, any[]>();
  students.forEach((s) => { const key = String(s.sectionId); (studentsBySection.get(key) || studentsBySection.set(key, []).get(key)!).push(s); });
  for (const sec of sections) {
    const subs = subjects.filter((s) => String(s.classId) === String(sec.classId));
    for (const sub of subs) {
      const exam = { _id: oid(), schoolId, classId: sec.classId, sectionId: sec._id, subjectId: sub._id, name: `${TAG_PREFIX}Midterm - ${sub.name}`, examType: "MIDTERM", date: new Date("2026-09-20"), totalMarks: 100 };
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

  // ---- homework / assignments / announcements / events / admission leads
  // Titles are tagged with CONTENT_TAG so cleanup can find them regardless
  // of which class/section they reference.
  const homework: any[] = [], assignments: any[] = [];
  const newSectionIds = new Set(sections.map((s) => String(s._id)));
  for (const sec of sections) {
    const subs = subjects.filter((s) => String(s.classId) === String(sec.classId));
    const t = teachers.find((t) => String(t.assignedClasses[0]) === String(sec.classId));
    if (!t) continue;
    for (let h = 0; h < 3; h++) homework.push({ schoolId, classId: sec.classId, sectionId: sec._id, subjectId: subs[h]._id, teacherId: t._id, title: `${CONTENT_TAG} ${subs[h].name} - Exercise ${h + 1}`, description: "Complete the exercise in your notebook.", dueDate: new Date(Date.now() + (h + 1) * 86400000 * 2) });
    for (let a = 0; a < 2; a++) assignments.push({ schoolId, classId: sec.classId, sectionId: sec._id, subjectId: subs[a + 3]._id, teacherId: t._id, title: `${CONTENT_TAG} ${subs[a + 3].name} Assignment ${a + 1}`, instructions: "Submit before the deadline.", totalMarks: 20, dueDate: new Date(Date.now() + (a + 3) * 86400000 * 3) });
  }
  await Homework.insertMany(homework);
  await Assignment.insertMany(assignments);
  const adminUser = await User.findOne({ schoolId, role: "SCHOOL_ADMIN" });
  await Announcement.insertMany([
    ["Welcome to the new session", "ALL", "NORMAL"], ["Fee submission last date is 10th of every month", "PARENTS", "HIGH"], ["Midterm exams start 20 September", "ALL", "HIGH"],
    ["Staff meeting on Friday 2pm", "TEACHERS", "NORMAL"], ["Winter uniform is now mandatory", "PARENTS", "NORMAL"], ["Sports day next month", "STUDENTS", "NORMAL"],
  ].map(([title, aud, pr]) => ({ schoolId, title: `${CONTENT_TAG} ${title}`, message: `${title}. Please check the portal for details.`, targetAudience: aud, priority: pr, createdBy: adminUser?._id })));
  await Event.insertMany([
    ["Midterm Exams", "EXAM", "2026-09-20"], ["Parent-Teacher Meeting", "PTM", "2026-10-05"], ["Sports Day", "SPORTS", "2026-10-25"], ["Annual Function", "FUNCTION", "2026-12-15"],
  ].map(([title, eventType, date]) => ({ schoolId, title: `${CONTENT_TAG} ${title}`, description: `${title} at school`, eventType, date: new Date(date) })));
  await Admission.insertMany(Array.from({ length: 15 }, (_, i) => ({ schoolId, applicantName: `${pick(i % 2 ? MALE : FEMALE, i * 3)} ${pick(SURNAMES, i * 2)}`, parentName: `${pick(MALE, i * 5)} ${pick(SURNAMES, i * 2)}`, parentContact: phone(i * 97), desiredClassId: classes[i % classes.length]._id, academicSystem: "National", status: pick(["APPLICATION", "REVIEW", "INTERVIEW", "APPROVED", "REJECTED"], i), notes: `${CONTENT_TAG} lead` })));

  console.log("\n==================== SUMMARY ====================");
  console.log(`Students: ${students.length} | Parents: ${parents.length} | Teachers: ${teachers.length} | User accounts: ${users.length}`);
  console.log(`Invoices: ${invoices.length} | Attendance rows: ${att.length} | Exams: ${exams.length} | Results: ${results.length}`);
  console.log(`Homework: ${homework.length} | Assignments: ${assignments.length}`);
  console.log(`\nSample logins (password for all: ${PASSWORD}):`);
  console.log(`  Teacher: teacher1@${DOMAIN}  |  Parent: parent1@${DOMAIN}  |  Student: student1@${DOMAIN}`);
  console.log(`  (Your existing school admin login still works as before - this script did not touch it.)`);
  console.log("\nWhen you're done, run: npx tsx src/scripts/realdata/cleanRealSchoolData.ts");
  await mongoose.disconnect();
}

main().catch((e) => { console.error("SEED FAILED:", e); process.exit(1); });
