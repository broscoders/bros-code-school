/**
 * Bro's Code - CLEANUP FOR seedRealSchoolData.ts + seedAllSections.ts
 *
 * Removes ONLY what those two scripts added:
 *   - Students whose admissionNumber starts with "DC-", and everything
 *     that references them (invoices, attendance, results, leave requests,
 *     hostel allocation, library loans, transport assignment, canteen
 *     orders, discipline/health/medical/achievement/certificate records,
 *     ID cards, quiz attempts)
 *   - Teachers with an employeeId starting with "DC-T", and their
 *     timetable slots, courses/lessons/study material, quizzes, ID cards
 *   - Staff (accountant/receptionist/librarian/etc) with an employeeId
 *     starting with "DC-S", and their payroll and staff-attendance records
 *   - Parents and every User account with an @demo.brosschool.local email
 *   - Every catalog-style record tagged "[Demo Data] ..." (departments,
 *     hostel buildings/rooms, library books, vehicles, canteen menu,
 *     inventory items, assets, maintenance tickets, surveys, leads,
 *     documents, homework/assignments/announcements/events)
 *   - Any "Grade 1".."Grade 10" class (+ its sections/subjects) that ends
 *     up with ZERO students left after all of the above. A class that
 *     already had real students before (e.g. a reused Grade 9/10/11) is
 *     left completely alone, along with its sections and subjects.
 *
 * Run (from the server folder): npx tsx src/scripts/realdata/cleanRealSchoolData.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../../models/Student";
import User from "../../models/User";
import Parent from "../../models/Parent";
import Teacher from "../../models/Teacher";
import Invoice from "../../models/Invoice";
import Attendance from "../../models/Attendance";
import Exam from "../../models/Exam";
import Result from "../../models/Result";
import ClassModel from "../../models/ClassModel";
import Section from "../../models/Section";
import Subject from "../../models/Subject";
import Homework from "../../models/Homework";
import Assignment from "../../models/Assignment";
import Announcement from "../../models/Announcement";
import Event from "../../models/Event";
import Admission from "../../models/Admission";
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
import { TAG_PREFIX, DOMAIN, CONTENT_TAG, confirmOrExit } from "./shared";

dotenv.config();

async function deleteInBatches(model: any, filter: any, label: string) {
  let total = 0;
  for (;;) {
    const batch = await model.find(filter).select("_id").limit(1000).lean();
    if (batch.length === 0) break;
    const r = await model.deleteMany({ _id: { $in: batch.map((b: any) => b._id) } });
    total += r.deletedCount || 0;
  }
  if (total) console.log(`  ${label}: ${total}`);
  return total;
}
async function idsOf(model: any, filter: any): Promise<any[]> {
  return (await model.find(filter).select("_id").lean()).map((d: any) => d._id);
}

(async () => {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) { console.error("MONGODB_URI is not set."); process.exit(1); }
  await confirmOrExit("DELETE all [Demo Data] added by seedRealSchoolData.ts / seedAllSections.ts", uri);
  await mongoose.connect(uri);

  const admissionRe = new RegExp("^" + TAG_PREFIX);
  const emailRe = new RegExp("@" + DOMAIN.replace(/\./g, "\\.") + "$");
  const tagRe = new RegExp("^" + CONTENT_TAG.replace(/[[\]]/g, "\\$&"));

  // ---- Resolve every tagged id FIRST, before anything is deleted, so every
  // step below can still find what it needs to clean up.
  const taggedStudents = await Student.find({ admissionNumber: admissionRe }).select("_id classId");
  const studentIds = taggedStudents.map((s) => s._id);
  const affectedClassIds = [...new Set(taggedStudents.map((s) => String(s.classId)))];
  const teacherDocs = await Teacher.find({ employeeId: new RegExp("^" + TAG_PREFIX + "T") }).select("_id");
  const teacherIds = teacherDocs.map((t) => t._id);
  const staffProfileIds = await idsOf(StaffProfile, { employeeId: new RegExp("^" + TAG_PREFIX + "S") });
  const allTaggedUserIds = await idsOf(User, { email: emailRe }); // students + parents + teachers + staff (all share this domain)
  const courseIds = await idsOf(Course, { createdBy: { $in: teacherIds } });
  const quizIds = await idsOf(Quiz, { createdBy: { $in: teacherIds } });
  const buildingIds = await idsOf(HostelBuilding, { name: tagRe });
  const surveyIds = await idsOf(Survey, { title: tagRe });
  console.log(`Found ${studentIds.length} tagged students, ${teacherIds.length} tagged teachers, ${staffProfileIds.length} tagged staff.`);

  let total = 0;
  // person-linked (student)
  total += await deleteInBatches(Invoice, { studentId: { $in: studentIds } }, "invoices");
  total += await deleteInBatches(Attendance, { studentId: { $in: studentIds } }, "attendance");
  total += await deleteInBatches(Result, { studentId: { $in: studentIds } }, "results");
  total += await deleteInBatches(Exam, { name: new RegExp("^" + TAG_PREFIX + "Midterm") }, "exams");
  total += await deleteInBatches(QuizAttempt, { studentId: { $in: studentIds } }, "quiz attempts");
  total += await deleteInBatches(HostelAllocation, { studentId: { $in: studentIds } }, "hostel allocations");
  total += await deleteInBatches(LibraryTransaction, { studentId: { $in: studentIds } }, "library transactions");
  total += await deleteInBatches(TransportAssignment, { studentId: { $in: studentIds } }, "transport assignments");
  total += await deleteInBatches(CanteenOrder, { studentId: { $in: studentIds } }, "canteen orders");
  total += await deleteInBatches(DisciplineIncident, { studentId: { $in: studentIds } }, "discipline incidents");
  total += await deleteInBatches(Achievement, { studentId: { $in: studentIds } }, "achievements");
  total += await deleteInBatches(HealthProfile, { studentId: { $in: studentIds } }, "health profiles");
  total += await deleteInBatches(MedicalIncident, { studentId: { $in: studentIds } }, "medical incidents");
  total += await deleteInBatches(Certificate, { studentId: { $in: studentIds } }, "certificates");
  total += await deleteInBatches(IDCardRecord, { personId: { $in: [...studentIds, ...teacherIds] } }, "ID cards");

  // person-linked (teacher / staff / any tagged user)
  total += await deleteInBatches(LeaveRequest, { requestedBy: { $in: allTaggedUserIds } }, "leave requests");
  total += await deleteInBatches(StaffAttendance, { userId: { $in: allTaggedUserIds } }, "staff attendance");
  total += await deleteInBatches(TimetableSlot, { teacherId: { $in: teacherIds } }, "timetable slots");
  total += await deleteInBatches(Lesson, { courseId: { $in: courseIds } }, "lessons");
  total += await deleteInBatches(Course, { _id: { $in: courseIds } }, "courses");
  total += await deleteInBatches(StudyMaterial, { teacherId: { $in: teacherIds } }, "study material");
  total += await deleteInBatches(Quiz, { _id: { $in: quizIds } }, "quizzes");
  total += await deleteInBatches(PayrollRecord, { staffId: { $in: staffProfileIds } }, "payroll records");
  total += await deleteInBatches(SurveyResponse, { surveyId: { $in: surveyIds } }, "survey responses");

  // catalog-style, tagged by name/title
  total += await deleteInBatches(HostelRoom, { buildingId: { $in: buildingIds } }, "hostel rooms");
  total += await deleteInBatches(HostelBuilding, { _id: { $in: buildingIds } }, "hostel buildings");
  total += await deleteInBatches(InventoryItem, { name: tagRe }, "inventory items");
  total += await deleteInBatches(Asset, { name: tagRe }, "assets");
  total += await deleteInBatches(MaintenanceTicket, { title: tagRe }, "maintenance tickets");
  total += await deleteInBatches(Visitor, { purpose: tagRe }, "visitors");
  total += await deleteInBatches(LibraryBook, { title: tagRe }, "library books");
  total += await deleteInBatches(Vehicle, { routeName: tagRe }, "vehicles");
  total += await deleteInBatches(CanteenItem, { name: tagRe }, "canteen items");
  total += await deleteInBatches(Lead, { notes: tagRe }, "leads");
  total += await deleteInBatches(SchoolDocument, { title: tagRe }, "documents");
  total += await deleteInBatches(Survey, { _id: { $in: surveyIds } }, "surveys");
  total += await deleteInBatches(Expense, { description: tagRe }, "expenses");
  total += await deleteInBatches(Department, { name: tagRe }, "departments");
  total += await deleteInBatches(Homework, { title: tagRe }, "homework");
  total += await deleteInBatches(Assignment, { title: tagRe }, "assignments");
  total += await deleteInBatches(Announcement, { title: tagRe }, "announcements");
  total += await deleteInBatches(Event, { title: tagRe }, "events");
  total += await deleteInBatches(Admission, { notes: tagRe }, "admission leads");

  // the people themselves (after everything referencing them is gone)
  total += await deleteInBatches(Student, { admissionNumber: admissionRe }, "students");
  total += await deleteInBatches(Parent, { userId: { $in: allTaggedUserIds } }, "parents");
  total += await deleteInBatches(StaffProfile, { _id: { $in: staffProfileIds } }, "staff profiles");
  total += await deleteInBatches(Teacher, { _id: { $in: teacherIds } }, "teachers");
  total += await deleteInBatches(User, { email: emailRe }, "user accounts (students/parents/teachers/staff)");

  // A class is only removed if it now has ZERO students left - so a class
  // this script reused (e.g. an existing "Grade 9" with real students
  // already in it) is never touched, even though tagged students were
  // added to it.
  console.log("\nChecking which classes can be safely removed...");
  let classesRemoved = 0, classesKept = 0;
  for (const classId of affectedClassIds) {
    const remaining = await Student.countDocuments({ classId });
    if (remaining > 0) { classesKept++; continue; }
    const cls = await ClassModel.findById(classId);
    if (!cls || !/^Grade \d+$/.test(cls.name)) { classesKept++; continue; } // safety: only ever remove our own naming pattern
    await Section.deleteMany({ classId });
    await Subject.deleteMany({ classId });
    await ClassModel.deleteOne({ _id: classId });
    classesRemoved++;
  }
  console.log(`  classes removed (now empty): ${classesRemoved} | classes kept (still has real students): ${classesKept}`);

  console.log(`\nDone. Removed ${total} tagged records plus ${classesRemoved} now-empty classes. Your school's real data was not touched.`);
  await mongoose.disconnect();
})().catch((e) => { console.error("CLEANUP FAILED:", e); process.exit(1); });
