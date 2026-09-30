/**
 * Bro's Code - FULL-PLATFORM DATA SEEDER (every remaining sidebar section)
 *
 * Run AFTER seedRealSchoolData.ts (needs its tagged students/teachers to
 * already exist). Fills in every other section of the school admin sidebar
 * that seed:full doesn't touch: Timetable, HR/Staff (extra roles),
 * Payroll, Leave Requests, LMS (courses/lessons/quizzes), Accounting
 * (expenses), Hostel, Library, Transport, Canteen, Inventory & Assets,
 * Maintenance, Discipline, Achievements, Visitors, Health & Medical,
 * Leads/CRM, Certificates, ID Cards, Documents, Surveys.
 *
 * Safety, by design:
 *  - Only reads existing tagged (DC-) students/teachers - never creates or
 *    touches anyone else.
 *  - Every person-linked record (payroll, leave, timetable, LMS, hostel
 *    allocation, library loan, transport assignment, canteen order,
 *    discipline/health/achievement/certificate/ID-card) references a
 *    tagged student/teacher/staff id, so cleanRealSchoolData.ts can find
 *    and remove it via that id.
 *  - Catalog-style records that don't belong to any one person (library
 *    book titles, canteen menu, hostel buildings/rooms, vehicles,
 *    inventory items, assets, departments, surveys) are tagged with the
 *    "[Demo Data]" prefix in their name/title so you can find and remove
 *    them by hand if you don't want them - cleanRealSchoolData.ts leaves
 *    these in place since they aren't tied to a specific person, so
 *    removing them automatically is more likely to be wrong than helpful.
 *  - Shows the DB host + name and asks you to type CONFIRM before writing.
 *
 * Run (from the server folder), against your real MONGODB_URI in .env:
 *   npx tsx src/scripts/realdata/seedAllSections.ts
 *
 * Options: SCHOOL_ID (same default as seedRealSchoolData.ts), CONFIRM=YES
 */
import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import School from "../../models/School";
import User from "../../models/User";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher";
import ClassModel from "../../models/ClassModel";
import Section from "../../models/Section";
import Subject from "../../models/Subject";
import Department from "../../models/Department";
import StaffProfile from "../../models/StaffProfile";
import StaffAttendance from "../../models/StaffAttendance";
import LeaveRequest from "../../models/LeaveRequest";
import TimetableSlot from "../../models/TimetableSlot";
import Course from "../../models/Course";
import Lesson from "../../models/Lesson";
import StudyMaterial from "../../models/StudyMaterial";
import Quiz from "../../models/Quiz";
import QuizAttempt from "../../models/QuizAttempt";
import Expense from "../../models/Expense";
import PayrollRecord from "../../models/PayrollRecord";
import HostelBuilding from "../../models/HostelBuilding";
import HostelRoom from "../../models/HostelRoom";
import HostelAllocation from "../../models/HostelAllocation";
import InventoryItem from "../../models/InventoryItem";
import Asset from "../../models/Asset";
import MaintenanceTicket from "../../models/MaintenanceTicket";
import DisciplineIncident from "../../models/DisciplineIncident";
import Achievement from "../../models/Achievement";
import Visitor from "../../models/Visitor";
import HealthProfile from "../../models/HealthProfile";
import MedicalIncident from "../../models/MedicalIncident";
import LibraryBook from "../../models/LibraryBook";
import LibraryTransaction from "../../models/LibraryTransaction";
import Vehicle from "../../models/Vehicle";
import TransportAssignment from "../../models/TransportAssignment";
import CanteenItem from "../../models/CanteenItem";
import CanteenOrder from "../../models/CanteenOrder";
import Lead from "../../models/Lead";
import Certificate from "../../models/Certificate";
import IDCardRecord from "../../models/IDCardRecord";
import SchoolDocument from "../../models/SchoolDocument";
import Survey from "../../models/Survey";
import SurveyResponse from "../../models/SurveyResponse";
import { TAG_PREFIX, DOMAIN, CONTENT_TAG, PASSWORD, confirmOrExit } from "./shared";

dotenv.config();

const DEFAULT_SCHOOL_ID = "6a7a34b8f4bf247132b2fe3e";
const SCHOOL_ID = process.env.SCHOOL_ID || DEFAULT_SCHOOL_ID;

const MALE = ["Ahmed", "Ali", "Hassan", "Hussain", "Usman", "Bilal", "Hamza", "Zain", "Faizan", "Awais"];
const FEMALE = ["Ayesha", "Fatima", "Zainab", "Maryam", "Hira", "Sana", "Iqra", "Areeba", "Noor", "Laiba"];
const SURNAMES = ["Khan", "Malik", "Butt", "Sheikh", "Chaudhry", "Qureshi", "Siddiqui", "Raza", "Iqbal", "Hashmi"];
const pick = <T,>(arr: T[], i: number) => arr[((i % arr.length) + arr.length) % arr.length];
const phone = (seed: number) => `03${(10 + (seed % 40)).toString()}${(1000000 + ((seed * 7919) % 8999999)).toString()}`;
const oid = () => new Types.ObjectId();
const T = (s: string) => `${CONTENT_TAG} ${s}`; // tag for catalog-style names/titles
const tagRe = new RegExp("^" + CONTENT_TAG.replace(/[[\]]/g, "\\$&")); // regex to find things T() tagged

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
async function chunkInsert(model: any, docs: any[], size = 1000) {
  for (let i = 0; i < docs.length; i += size) await model.insertMany(docs.slice(i, i + size), { ordered: false });
}

async function main() {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) { console.error("MONGODB_URI is not set (check server/.env)."); process.exit(1); }
  await confirmOrExit(`ADD full-platform sample data (timetable, HR, LMS, hostel, library, transport, canteen, etc.) to school ${SCHOOL_ID}`, uri);

  await mongoose.connect(uri);
  const school = await School.findById(SCHOOL_ID);
  if (!school) { console.error(`\nSchool ${SCHOOL_ID} not found.`); await mongoose.disconnect(); process.exit(1); }
  const schoolId = school._id as Types.ObjectId;

  const students = await Student.find({ schoolId, admissionNumber: new RegExp("^" + TAG_PREFIX) });
  const teachers = await Teacher.find({ schoolId, employeeId: new RegExp("^" + TAG_PREFIX + "T") });
  if (students.length === 0 || teachers.length === 0) {
    console.error(`\nNo tagged (${TAG_PREFIX}...) students/teachers found in this school. Run "npm run seed:full" first, then run this script.`);
    await mongoose.disconnect();
    process.exit(1);
  }
  const classes = await ClassModel.find({ schoolId, name: /^Grade \d+$/ });
  const sections = await Section.find({ schoolId, classId: { $in: classes.map((c) => c._id) } });
  const subjects = await Subject.find({ schoolId, classId: { $in: classes.map((c) => c._id) } });
  console.log(`Found ${students.length} tagged students, ${teachers.length} tagged teachers, ${classes.length} classes, ${sections.length} sections.`);

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---- Departments (idempotent: only created the first time this runs)
  const deptNames = ["Academics", "Administration", "Finance", "Support Services"];
  const departments: any[] = [];
  for (const name of deptNames) {
    let d = await Department.findOne({ schoolId, name: T(name) });
    if (!d) d = await Department.create({ schoolId, name: T(name) });
    departments.push(d);
  }

  // ---- Extra staff (accountant, receptionist, librarian, transport manager,
  // nurse, hostel warden, admission staff, academic coordinator). Idempotent:
  // if this already ran once, reuse the same 8 staff instead of creating a
  // second set (running this again after adding more students should not
  // duplicate staff or their unique-numbered records).
  const STAFF: [string, string, string][] = [
    ["ACCOUNTANT", "Accountant", "Finance"], ["RECEPTIONIST", "Receptionist", "Administration"], ["LIBRARIAN", "Librarian", "Support Services"],
    ["TRANSPORT_MANAGER", "Transport Manager", "Support Services"], ["NURSE", "School Nurse", "Support Services"], ["HOSTEL_WARDEN", "Hostel Warden", "Support Services"],
    ["ADMISSION_STAFF", "Admissions Officer", "Administration"], ["ACADEMIC_COORDINATOR", "Academic Coordinator", "Academics"],
  ];
  let staffUsers: any[] = [];
  let staffProfileDocs: any[] = await StaffProfile.find({ schoolId, employeeId: new RegExp("^" + TAG_PREFIX + "S") });
  if (staffProfileDocs.length > 0) {
    staffUsers = await User.find({ _id: { $in: staffProfileDocs.map((s: any) => s.userId) } });
    console.log(`Reusing ${staffProfileDocs.length} staff accounts already created by an earlier run.`);
  } else {
    const newStaffProfiles: any[] = [];
    STAFF.forEach(([role, designation, deptName], i) => {
      const first = pick(i % 2 ? MALE : FEMALE, i * 3);
      const u = { _id: oid(), name: `${first} ${pick(SURNAMES, i * 5)}`, email: `staff${i + 1}@${DOMAIN}`, phone: phone(i * 17), password: passwordHash, role, schoolId, isEmailVerified: true, isActive: true, accountStatus: "ACTIVE" };
      staffUsers.push(u);
      const dept = departments.find((d) => d.name === T(deptName));
      newStaffProfiles.push({ schoolId, userId: u._id, employeeId: `${TAG_PREFIX}S${i + 1}`, departmentId: dept?._id, designation, joiningDate: new Date("2026-08-01"), employmentStatus: "ACTIVE", basicSalary: 35000 + i * 5000 });
    });
    await User.insertMany(staffUsers, { ordered: false });
    staffProfileDocs = await StaffProfile.insertMany(newStaffProfiles);
    console.log(`Created ${STAFF.length} staff accounts (accountant, receptionist, librarian, transport manager, nurse, warden, admissions, coordinator).`);
  }

  // ---- Staff attendance (teachers + staff), last 20 weekdays. Skipped for
  // any user who already has attendance rows from an earlier run.
  const days20 = weekdaysBack(20);
  const allStaffUserIds = [...teachers.map((t) => t.userId), ...staffUsers.map((u) => u._id)];
  const alreadyMarked = new Set((await StaffAttendance.find({ schoolId, userId: { $in: allStaffUserIds } }).select("userId")).map((a: any) => String(a.userId)));
  const newStaffAttendanceUserIds = allStaffUserIds.filter((uid) => !alreadyMarked.has(String(uid)));
  const staffAtt: any[] = [];
  newStaffAttendanceUserIds.forEach((uid, i) => {
    days20.forEach((d, di) => {
      const r = (i * 11 + di * 7) % 100;
      staffAtt.push({ schoolId, userId: uid, date: d, status: r < 92 ? "PRESENT" : r < 97 ? "LATE" : "ABSENT", markedBy: staffUsers[0]._id });
    });
  });
  await chunkInsert(StaffAttendance, staffAtt, 2000);

  // ---- Leave requests (mix of student and teacher) - only added the first
  // time this runs; not worth growing on every re-run.
  const leaveRequests: any[] = [];
  if ((await LeaveRequest.countDocuments({ schoolId, requestedBy: { $in: allStaffUserIds } })) === 0) {
    for (let i = 0; i < 6; i++) leaveRequests.push({ schoolId, requestedBy: teachers[i % teachers.length].userId, teacherId: teachers[i % teachers.length]._id, type: "TEACHER", reason: "Personal leave", date: new Date(Date.now() + i * 86400000), status: pick(["PENDING", "APPROVED", "REJECTED"], i) });
    for (let i = 0; i < 6; i++) leaveRequests.push({ schoolId, requestedBy: students[i % students.length].userId, studentId: students[i % students.length]._id, type: "STUDENT", reason: "Family function", date: new Date(Date.now() + i * 86400000), status: pick(["PENDING", "APPROVED"], i) });
    await LeaveRequest.insertMany(leaveRequests);
  }

  // ---- Timetable: periods 1-6, Mon-Fri, for every section that doesn't
  // already have one (skips sections already scheduled by an earlier run,
  // using that class's own tagged teachers/subjects)
  const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  const sectionsWithTimetable = new Set((await TimetableSlot.find({ schoolId, sectionId: { $in: sections.map((s) => s._id) } }).select("sectionId")).map((s: any) => String(s.sectionId)));
  const slots: any[] = [];
  for (const sec of sections) {
    if (sectionsWithTimetable.has(String(sec._id))) continue;
    const classSubjects = subjects.filter((s) => String(s.classId) === String(sec.classId));
    const classTeachers = teachers.filter((t) => t.assignedClasses.some((c: any) => String(c) === String(sec.classId)));
    if (classSubjects.length === 0 || classTeachers.length === 0) continue;
    for (const day of DAYS) {
      for (let period = 1; period <= 6; period++) {
        const sub = classSubjects[(period - 1) % classSubjects.length];
        const teacher = classTeachers[(period - 1) % classTeachers.length];
        const startHour = 7 + period;
        slots.push({ schoolId, classId: sec.classId, sectionId: sec._id, dayOfWeek: day, periodNumber: period, startTime: `${String(startHour).padStart(2, "0")}:00`, endTime: `${String(startHour).padStart(2, "0")}:40`, subjectId: sub._id, teacherId: teacher._id, room: `Room ${sec.name}${period}` });
      }
    }
  }
  await chunkInsert(TimetableSlot, slots, 2000);
  console.log(`Timetable: ${slots.length} periods across ${sections.length} sections.`);

  // ---- LMS: one course per class, 3 lessons + 1 study material + 1 quiz
  // each - skips a class that already has a tagged course from an earlier run
  const classesWithCourse = new Set((await Course.find({ schoolId, classId: { $in: classes.map((c) => c._id) } }).select("classId")).map((c: any) => String(c.classId)));
  const courses: any[] = [], lessons: any[] = [], materials: any[] = [], quizzes: any[] = [];
  for (const cls of classes) {
    if (classesWithCourse.has(String(cls._id))) continue;
    const sub = subjects.find((s) => String(s.classId) === String(cls._id));
    const teacher = teachers.find((t) => t.assignedClasses.some((c: any) => String(c) === String(cls._id)));
    if (!sub || !teacher) continue;
    const course = { _id: oid(), schoolId, classId: cls._id, subjectId: sub._id, title: T(`${cls.name} - ${sub.name} Course`), description: "Full course content for the term.", createdBy: teacher._id, isPublished: true };
    courses.push(course);
    for (let l = 1; l <= 3; l++) lessons.push({ schoolId, courseId: course._id, moduleName: `Module ${l}`, title: `Lesson ${l}: ${sub.name} basics`, contentType: "TEXT", textContent: "Lesson content goes here.", order: l });
    materials.push({ schoolId, classId: cls._id, subjectId: sub._id, teacherId: teacher._id, title: T(`${sub.name} Notes - ${cls.name}`), chapter: "Chapter 1", fileUrl: "https://files.brosschool.local/demo/notes.pdf" });
    const sec = sections.find((s) => String(s.classId) === String(cls._id));
    quizzes.push({
      _id: oid(), schoolId, classId: cls._id, sectionId: sec?._id, subjectId: sub._id, title: T(`${sub.name} Quick Quiz`), description: "5-question quick quiz.", timeLimitMinutes: 15, createdBy: teacher._id,
      questions: Array.from({ length: 5 }, (_, i) => ({ questionType: "MCQ", questionText: `${sub.name} sample question ${i + 1}?`, options: ["Option A", "Option B", "Option C", "Option D"], correctOptionIndex: i % 4 })),
    });
  }
  if (courses.length) await Course.insertMany(courses);
  if (lessons.length) await Lesson.insertMany(lessons);
  if (materials.length) await StudyMaterial.insertMany(materials);
  if (quizzes.length) await Quiz.insertMany(quizzes);
  // Quiz attempts: cover every tagged quiz (old + new), but only for
  // students who don't already have an attempt on it - so re-running after
  // adding more students gives the new ones a quiz attempt too, without
  // duplicating attempts for students who already took it.
  const allTaggedQuizzes = await Quiz.find({ schoolId, classId: { $in: classes.map((c) => c._id) } }).select("_id classId");
  const attempts: any[] = [];
  for (const q of allTaggedQuizzes) {
    const alreadyAttempted = new Set((await QuizAttempt.find({ quizId: q._id }).select("studentId")).map((a: any) => String(a.studentId)));
    const classStudents = students.filter((s) => String(s.classId) === String(q.classId) && !alreadyAttempted.has(String(s._id))).slice(0, 8);
    classStudents.forEach((s, i) => attempts.push({ schoolId, quizId: q._id, studentId: s._id, attemptNumber: 1, score: 2 + (i % 4), totalQuestions: 5, status: "SUBMITTED", submittedAt: new Date() }));
  }
  if (attempts.length) await QuizAttempt.insertMany(attempts);
  console.log(`LMS: ${courses.length} courses, ${lessons.length} lessons, ${quizzes.length} quizzes, ${attempts.length} quiz attempts.`);

  // A big chunk of what follows is "catalog" data that doesn't need to grow
  // just because more students were added (hostel buildings, library
  // catalog, vehicles, canteen menu, inventory, assets, leads, documents,
  // surveys). It's created ONCE; if this script runs again later it's
  // fetched instead of recreated, which also avoids colliding on the
  // unique asset/certificate/ID-card numbers below.
  const catalogAlreadySeeded = (await HostelBuilding.countDocuments({ schoolId, name: tagRe })) > 0;

  // Only students who don't already have an ID card are "new" for every
  // per-student section below - so re-running this after seeding more
  // students only fills in the new ones, and numbering (certificate/ID card)
  // continues rather than colliding.
  const alreadyCardedStudentIds = new Set((await IDCardRecord.find({ schoolId, personType: "STUDENT", cardNumber: new RegExp("^" + TAG_PREFIX + "ID-S-") }).select("personId")).map((c: any) => String(c.personId)));
  const newStudents = students.filter((s) => !alreadyCardedStudentIds.has(String(s._id)));
  const existingStudentCount = students.length - newStudents.length; // used to continue numbering
  console.log(`${newStudents.length} of ${students.length} tagged students are new since the last run of this script.`);

  const adminUser = await User.findOne({ schoolId, role: "SCHOOL_ADMIN" });

  if (!catalogAlreadySeeded) {
    // ---- Accounting: expenses
    const expenseCats: [string, number][] = [["Utilities", 45000], ["Salaries", 850000], ["Supplies", 22000], ["Maintenance", 18000], ["Marketing", 15000], ["Transport Fuel", 32000]];
    await Expense.insertMany(expenseCats.map(([category, amount], i) => ({ schoolId, category, description: T(`${category} - September`), amount, vendor: `Vendor ${i + 1}`, date: new Date(2026, 8, 5 + i) })));

    // ---- Inventory & Assets
    const inventory = [["Notebooks", "Stationery", 500], ["Whiteboard Markers", "Stationery", 120], ["Chairs", "Furniture", 300], ["Desks", "Furniture", 150], ["Lab Beakers", "Lab Equipment", 80], ["Sports Balls", "Sports", 40], ["First Aid Kits", "Medical", 15], ["Printer Paper (reams)", "Stationery", 200]]
      .map(([name, category, quantity]) => ({ schoolId, name: T(name as string), category, quantity, unit: "pcs" }));
    await InventoryItem.insertMany(inventory);
    const assetCats = ["Computer", "Projector", "Air Conditioner", "Generator", "CCTV Camera", "Photocopier"];
    await Asset.insertMany(assetCats.map((name, i) => ({ schoolId, name: T(name), category: name, location: `Block ${pick(["A", "B", "C"], i)}`, purchaseDate: new Date("2025-01-10"), condition: pick(["GOOD", "FAIR", "GOOD", "NEEDS_REPAIR"], i), assetTag: `${TAG_PREFIX}AST-${String(i + 1).padStart(3, "0")}` })));

    // ---- Maintenance tickets
    const tickets = [["Leaking tap in washroom", "Block A washroom"], ["Projector not working", "Grade 5 classroom"], ["Broken window", "Grade 3 classroom"], ["AC not cooling", "Staff room"], ["Flickering lights", "Corridor B"]]
      .map(([title, loc], i) => ({ schoolId, reportedBy: staffUsers[i % staffUsers.length]._id, title: T(title as string), description: `${title} - reported at ${loc}.`, priority: pick(["LOW", "MEDIUM", "HIGH"], i), status: pick(["REPORTED", "ASSIGNED", "IN_PROGRESS", "RESOLVED"], i) }));
    await MaintenanceTicket.insertMany(tickets);

    // ---- Visitors
    const visitors = Array.from({ length: 12 }, (_, i) => ({ schoolId, name: `${pick(MALE, i * 3)} ${pick(SURNAMES, i * 2)}`, contact: phone(i * 41), purpose: T(pick(["Admission inquiry", "Fee query", "Meeting teacher", "Vendor visit", "Delivery"], i)), personToMeet: pick(["Admin Office", "Accounts", "Principal"], i), checkInTime: new Date(Date.now() - i * 3600000), checkOutTime: i % 3 === 0 ? undefined : new Date(Date.now() - i * 3600000 + 1800000), status: i % 3 === 0 ? "CHECKED_IN" : "CHECKED_OUT" }));
    await Visitor.insertMany(visitors);

    // ---- Library catalog
    const bookTitles = ["Mathematics Made Easy", "English Grammar Guide", "Urdu Adab", "Science Explorer", "Islamic Studies", "History of Pakistan", "General Knowledge", "Story Collection", "Atlas of the World", "Computer Basics"];
    await LibraryBook.insertMany(bookTitles.map((title, i) => ({ schoolId, title: T(title), author: `Author ${i + 1}`, category: pick(["Textbook", "Reference", "Fiction"], i), totalCopies: 10, availableCopies: 10 })));

    // ---- Transport vehicles
    const routeNames = ["Route A - Model Town", "Route B - Johar Town", "Route C - DHA", "Route D - Gulberg", "Route E - Township"];
    await Vehicle.insertMany(routeNames.map((routeName, i) => ({ schoolId, vehicleNumber: `${TAG_PREFIX}BUS-${i + 1}`, driverName: `${pick(MALE, i * 7)} ${pick(SURNAMES, i * 3)}`, driverContact: phone(i * 53), routeName: T(routeName), capacity: 40 })));

    // ---- Canteen menu
    const menu = [["Chicken Patty", "SNACK", 80], ["Samosa", "SNACK", 30], ["Juice Box", "BEVERAGE", 60], ["Sandwich", "MEAL", 120], ["Biryani", "MEAL", 150], ["Water Bottle", "BEVERAGE", 40], ["Chips", "SNACK", 50], ["Tea", "BEVERAGE", 30]]
      .map(([name, category, price]) => ({ schoolId, name: T(name as string), category, price }));
    await CanteenItem.insertMany(menu);

    // ---- CRM leads
    await Lead.insertMany(Array.from({ length: 20 }, (_, i) => ({ schoolId, name: `${pick(i % 2 ? MALE : FEMALE, i * 3)} ${pick(SURNAMES, i * 2)}`, contact: phone(i * 61), source: pick(["Walk-in", "Facebook", "Referral", "Website"], i), interestedIn: classes[i % classes.length]?.name, status: pick(["NEW", "CONTACTED", "DEMO_SCHEDULED", "CONVERTED", "LOST"], i), notes: T("lead") })));

    // ---- Documents (metadata only - fileUrl is a placeholder, not a real file)
    const docs = [["School Registration Certificate", "SCHOOL"], ["Fire Safety Compliance", "SCHOOL"], ["Sample Admission Form", "STUDENT"], ["Staff Contract Template", "STAFF"]]
      .map(([title, category], i) => ({ schoolId, category, title: T(title as string), fileUrl: `https://files.brosschool.local/demo/doc-${i + 1}.pdf`, uploadedBy: adminUser?._id, uploadedByName: adminUser?.name || "Admin" }));
    await SchoolDocument.insertMany(docs);

    // ---- Surveys (responses only from the first batch of students/teachers)
    const surveyDefs = [["Parent Satisfaction Survey", "PARENTS"], ["Teacher Feedback Survey", "TEACHERS"], ["Student Experience Survey", "STUDENTS"]];
    const surveyDocs = await Survey.insertMany(surveyDefs.map(([title, aud]) => ({ schoolId, title: T(title as string), targetAudience: aud, isActive: true })));
    const surveyResponses: any[] = [];
    surveyDocs.forEach((survey: any, si) => {
      const responders = si === 0 ? students.slice(0, 10).map((s) => s.userId) : si === 1 ? teachers.slice(0, 5).map((t) => t.userId) : students.slice(10, 20).map((s) => s.userId);
      responders.forEach((uid) => surveyResponses.push({ surveyId: survey._id, respondedBy: uid }));
    });
    await SurveyResponse.insertMany(surveyResponses);

    // ---- Hostel buildings + rooms (allocation itself happens below, for
    // newStudents, so it also runs the very first time)
    const newBoys = await HostelBuilding.create({ schoolId, name: T("Boys Hostel"), type: "BOYS", wardenName: staffUsers.find((u) => u.role === "HOSTEL_WARDEN")?.name });
    const newGirls = await HostelBuilding.create({ schoolId, name: T("Girls Hostel"), type: "GIRLS", wardenName: staffUsers.find((u) => u.role === "HOSTEL_WARDEN")?.name });
    const newRooms: any[] = [];
    for (let i = 1; i <= 10; i++) newRooms.push({ schoolId, buildingId: newBoys._id, roomNumber: `B-${i}`, capacity: 4 });
    for (let i = 1; i <= 10; i++) newRooms.push({ schoolId, buildingId: newGirls._id, roomNumber: `G-${i}`, capacity: 4 });
    await HostelRoom.insertMany(newRooms);
    console.log("Catalog data created: expenses, inventory, assets, maintenance tickets, visitors, library titles, vehicles, canteen menu, leads, documents, surveys, hostel buildings.");
  } else {
    console.log("Catalog data already exists from an earlier run - skipping (not re-creating hostel/library/vehicles/menu/etc).");
  }

  // ---- Payroll: 2 months for each staff member, only if not already paid
  const payrollExists = (await PayrollRecord.countDocuments({ schoolId, staffId: { $in: staffProfileDocs.map((s: any) => s._id) } })) > 0;
  if (!payrollExists) {
    const payroll: any[] = [];
    staffProfileDocs.forEach((sp: any) => {
      ["August", "September"].forEach((month) => {
        const net = sp.basicSalary + 2000 - 500;
        payroll.push({ schoolId, staffId: sp._id, month, year: 2026, basicSalary: sp.basicSalary, allowances: 2000, deductions: 500, netSalary: net, status: month === "August" ? "PAID" : "PENDING", paidDate: month === "August" ? new Date("2026-08-30") : undefined });
      });
    });
    await PayrollRecord.insertMany(payroll);
  }

  // ---- Hostel allocation for newStudents only (~12% of the NEW batch)
  const boys = await HostelBuilding.findOne({ schoolId, type: "BOYS", name: tagRe });
  const girls = await HostelBuilding.findOne({ schoolId, type: "GIRLS", name: tagRe });
  const buildingIdsForRooms: Types.ObjectId[] = [boys?._id, girls?._id].filter((x): x is Types.ObjectId => Boolean(x));
  const roomDocs = await HostelRoom.find({ schoolId, buildingId: { $in: buildingIdsForRooms } });
  const roomOccupancy = new Map<string, number>(roomDocs.map((r: any) => [String(r._id), r.occupied || 0]));
  const hostelStudents = newStudents.filter((_, i) => i % 8 === 0);
  const allocations: any[] = [];
  hostelStudents.forEach((s, i) => {
    const pool = roomDocs.filter((r: any) => String(r.buildingId) === String(s.gender === "Male" ? boys?._id : girls?._id));
    if (pool.length === 0) return;
    const room = pool[i % pool.length];
    const occ = (roomOccupancy.get(String(room._id)) || 0) + 1;
    if (occ > (room.capacity || 4)) return; // don't overfill a room
    roomOccupancy.set(String(room._id), occ);
    allocations.push({ schoolId, studentId: s._id, roomId: room._id, allocationDate: new Date("2026-08-05"), isActive: true, monthlyFee: 8000 });
  });
  if (allocations.length) await HostelAllocation.insertMany(allocations);
  await HostelRoom.bulkWrite(Array.from(roomOccupancy.entries()).map(([roomId, occ]) => ({ updateOne: { filter: { _id: roomId }, update: { occupied: occ } } })));
  console.log(`Hostel: ${roomDocs.length} rooms across 2 buildings, ${allocations.length} newly allocated students.`);

  // ---- Discipline incidents (sample of the new students)
  const discStudents = newStudents.filter((_, i) => i % 15 === 0).slice(0, 10);
  if (discStudents.length) await DisciplineIncident.insertMany(discStudents.map((s, i) => ({ schoolId, studentId: s._id, reportedBy: teachers[i % teachers.length].userId, incidentType: pick(["WARNING", "MINOR", "MAJOR"], i), description: "Classroom conduct issue.", actionTaken: "Verbal warning given.", parentNotified: i % 2 === 0, status: pick(["OPEN", "RESOLVED"], i) })));

  // ---- Achievements (sample of the new students)
  const achStudents = newStudents.filter((_, i) => i % 12 === 0).slice(0, 15);
  if (achStudents.length) await Achievement.insertMany(achStudents.map((s, i) => ({ schoolId, studentId: s._id, title: pick(["Best Student Award", "Science Fair Winner", "Sports Championship", "Perfect Attendance", "Quiz Competition Winner"], i), category: pick(["ACADEMIC", "SPORTS", "COMPETITION", "APPRECIATION"], i), description: "Recognized for outstanding performance.", dateAwarded: new Date("2026-09-15") })));

  // ---- Health profiles (every new student - unique per student, so this
  // must never re-run for a student who already has one) + a few incidents
  const healthProfiles = newStudents.map((s, i) => ({ schoolId, studentId: s._id, bloodGroup: pick(["A+", "B+", "O+", "AB+", "A-", "O-"], i), allergies: i % 10 === 0 ? "Peanuts" : undefined, emergencyContactName: "Parent/Guardian", emergencyContactPhone: phone(i * 3), medicalNotes: "" }));
  if (healthProfiles.length) await chunkInsert(HealthProfile, healthProfiles, 2000);
  const medStudents = newStudents.filter((_, i) => i % 20 === 0).slice(0, 8);
  if (medStudents.length) await MedicalIncident.insertMany(medStudents.map((s, i) => ({ schoolId, studentId: s._id, description: pick(["Minor fall during sports", "Headache, given rest", "Stomach ache after lunch"], i), actionTaken: "First aid given, monitored.", severity: pick(["MINOR", "MODERATE"], i), status: "RESOLVED", parentNotified: true, recordedBy: staffUsers.find((u) => u.role === "NURSE")?._id })));

  // ---- Library loans for new students
  const bookDocs = await LibraryBook.find({ schoolId, title: tagRe });
  const libStudents = newStudents.filter((_, i) => i % 5 === 0);
  const libTx = libStudents.map((s, i) => {
    const book = bookDocs[i % bookDocs.length];
    const issueDate = new Date(Date.now() - (5 + (i % 20)) * 86400000);
    const dueDate = new Date(issueDate.getTime() + 14 * 86400000);
    const returned = i % 3 !== 0;
    return { schoolId, bookId: book._id, studentId: s._id, issueDate, dueDate, returnDate: returned ? new Date(dueDate.getTime() - 86400000) : undefined, status: returned ? "RETURNED" : dueDate < new Date() ? "OVERDUE" : "ISSUED" };
  });
  if (libTx.length) await chunkInsert(LibraryTransaction, libTx, 2000);
  console.log(`Library: ${bookDocs.length} titles, ${libTx.length} new issue records.`);

  // ---- Transport assignment for new students
  const vehicleDocs = await Vehicle.find({ schoolId, routeName: tagRe });
  const vehicleOccupancy = new Map<string, number>(vehicleDocs.map((v: any) => [String(v._id), v.occupied || 0]));
  const transportStudents = newStudents.filter((_, i) => i % 4 === 0);
  const transportAssignments: any[] = [];
  transportStudents.forEach((s, i) => {
    const v = vehicleDocs[i % vehicleDocs.length];
    if (!v) return;
    const occ = (vehicleOccupancy.get(String(v._id)) || 0) + 1;
    if (occ > v.capacity) return;
    vehicleOccupancy.set(String(v._id), occ);
    transportAssignments.push({ schoolId, studentId: s._id, vehicleId: v._id, monthlyFee: 3000 });
  });
  if (transportAssignments.length) await TransportAssignment.insertMany(transportAssignments);
  await Vehicle.bulkWrite(Array.from(vehicleOccupancy.entries()).map(([id, occ]) => ({ updateOne: { filter: { _id: id }, update: { occupied: occ } } })));
  console.log(`Transport: ${vehicleDocs.length} vehicles, ${transportAssignments.length} newly assigned students.`);

  // ---- Canteen orders for new students
  const menuDocs = await CanteenItem.find({ schoolId, name: tagRe });
  const canteenStudents = newStudents.filter((_, i) => i % 6 === 0);
  const canteenOrders = canteenStudents.map((s, i) => {
    const item1 = menuDocs[i % menuDocs.length];
    const item2 = menuDocs[(i + 3) % menuDocs.length];
    const total = Number(item1.price) + Number(item2.price);
    return { schoolId, studentId: s._id, items: [{ itemId: item1._id, itemName: item1.name, price: item1.price, quantity: 1 }, { itemId: item2._id, itemName: item2.name, price: item2.price, quantity: 1 }], totalAmount: total, status: pick(["PLACED", "PREPARING", "READY", "COLLECTED"], i), orderDate: new Date(Date.now() - (i % 5) * 86400000) };
  });
  if (canteenOrders.length) await CanteenOrder.insertMany(canteenOrders);

  // ---- Certificates for a sample of new students (numbering continues from
  // where the last run left off, so it can never collide)
  const certStudents = newStudents.filter((_, i) => i % 10 === 0).slice(0, 15);
  if (certStudents.length) {
    await Certificate.insertMany(certStudents.map((s, i) => ({ schoolId, studentId: s._id, title: T("Certificate of Achievement"), type: "ACHIEVEMENT", certificateNumber: `${TAG_PREFIX}CERT-${String(existingStudentCount + i + 1).padStart(4, "0")}`, issueDate: new Date("2026-09-20") })));
  }

  // ---- ID cards for every new student and every teacher not yet carded
  const idCards: any[] = [];
  newStudents.forEach((s, i) => idCards.push({ schoolId, personType: "STUDENT", personId: s._id, cardNumber: `${TAG_PREFIX}ID-S-${String(existingStudentCount + i + 1).padStart(5, "0")}`, issuedBy: adminUser?._id }));
  const alreadyCardedTeacherIds = new Set((await IDCardRecord.find({ schoolId, personType: "TEACHER", cardNumber: new RegExp("^" + TAG_PREFIX + "ID-T-") }).select("personId")).map((c: any) => String(c.personId)));
  const newTeachers = teachers.filter((t) => !alreadyCardedTeacherIds.has(String(t._id)));
  const existingTeacherCount = teachers.length - newTeachers.length;
  newTeachers.forEach((t, i) => idCards.push({ schoolId, personType: "TEACHER", personId: t._id, cardNumber: `${TAG_PREFIX}ID-T-${String(existingTeacherCount + i + 1).padStart(5, "0")}`, issuedBy: adminUser?._id }));
  if (idCards.length) await chunkInsert(IDCardRecord, idCards, 2000);

  console.log("\n==================== SUMMARY (this run) ====================");
  console.log(`New students processed: ${newStudents.length} of ${students.length} total tagged | New teachers carded: ${newTeachers.length} of ${teachers.length} total`);
  console.log(`Departments: ${departments.length} | Staff: ${staffProfileDocs.length} | New staff-attendance rows: ${staffAtt.length} | Leave requests added: ${leaveRequests.length}`);
  console.log(`New timetable slots: ${slots.length} (0 means every section already had one)`);
  console.log(`LMS - New courses: ${courses.length} | New lessons: ${lessons.length} | New quizzes: ${quizzes.length} | New quiz attempts: ${attempts.length}`);
  console.log(`Catalog data (expenses/inventory/assets/maintenance/visitors/library/vehicles/canteen/leads/documents/surveys/hostel buildings): ${catalogAlreadySeeded ? "already existed, not recreated" : "created"}`);
  console.log(`Hostel rooms: ${roomDocs.length} | New allocations: ${allocations.length}`);
  console.log(`New discipline records: ${discStudents.length} | New achievements: ${achStudents.length}`);
  console.log(`New health profiles: ${healthProfiles.length} | New medical incidents: ${medStudents.length}`);
  console.log(`Library titles: ${bookDocs.length} | New issue records: ${libTx.length}`);
  console.log(`Vehicles: ${vehicleDocs.length} | New transport assignments: ${transportAssignments.length}`);
  console.log(`Canteen items: ${menuDocs.length} | New canteen orders: ${canteenOrders.length}`);
  console.log(`New certificates: ${certStudents.length} | New ID cards: ${idCards.length}`);
  console.log(`\nExtra staff logins (password: ${PASSWORD}): staff1@${DOMAIN} .. staff${staffProfileDocs.length}@${DOMAIN}`);
  console.log("(staff1=Accountant, staff2=Receptionist, staff3=Librarian, staff4=Transport Manager, staff5=Nurse, staff6=Hostel Warden, staff7=Admissions Officer, staff8=Academic Coordinator)");
  console.log("\nWhen you're done, run: npx tsx src/scripts/realdata/cleanRealSchoolData.ts");
  await mongoose.disconnect();
}

main().catch((e) => { console.error("SEED FAILED:", e); process.exit(1); });
