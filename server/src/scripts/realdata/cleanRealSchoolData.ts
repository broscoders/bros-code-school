/**
 * Bro's Code - CLEANUP FOR seedRealSchoolData.ts
 *
 * Removes ONLY what seedRealSchoolData.ts added:
 *   - Students whose admissionNumber starts with "DC-", and their
 *     Invoices, Attendance, Results
 *   - Parents and User accounts with an @demo.brosschool.local email
 *   - Teachers with an employeeId starting with "DC-T"
 *   - Exams named "DC-Midterm - ..."
 *   - Homework / Assignments / Announcements / Events titled "[Demo Data] ..."
 *   - Admission leads noted "[Demo Data] lead"
 *   - Any "Grade 1".."Grade 10" class (+ its sections/subjects) that this
 *     script's students were the ONLY students in - checked by counting
 *     remaining students in that class AFTER the deletions above. A class
 *     that already had real students before (e.g. reused Grade 9/10/11) is
 *     left completely alone.
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

(async () => {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) { console.error("MONGODB_URI is not set."); process.exit(1); }
  await confirmOrExit("DELETE all real-school demo data added by seedRealSchoolData.ts", uri);
  await mongoose.connect(uri);

  const taggedStudents = await Student.find({ admissionNumber: new RegExp("^" + TAG_PREFIX) }).select("_id schoolId classId");
  const studentIds = taggedStudents.map((s) => s._id);
  const affectedClassIds = [...new Set(taggedStudents.map((s) => String(s.classId)))];
  console.log(`Found ${studentIds.length} tagged students across ${affectedClassIds.length} classes.`);

  let total = 0;
  total += await deleteInBatches(Invoice, { studentId: { $in: studentIds } }, "invoices");
  total += await deleteInBatches(Attendance, { studentId: { $in: studentIds } }, "attendance");
  total += await deleteInBatches(Result, { studentId: { $in: studentIds } }, "results");
  total += await deleteInBatches(Exam, { name: new RegExp("^" + TAG_PREFIX + "Midterm") }, "exams");
  total += await deleteInBatches(Student, { admissionNumber: new RegExp("^" + TAG_PREFIX) }, "students");

  const taggedUserIds = (await User.find({ email: new RegExp("@" + DOMAIN.replace(".", "\\.") + "$") }).select("_id")).map((u) => u._id);
  total += await deleteInBatches(Parent, { userId: { $in: taggedUserIds } }, "parents");
  total += await deleteInBatches(Teacher, { employeeId: new RegExp("^" + TAG_PREFIX + "T") }, "teachers");
  total += await deleteInBatches(User, { email: new RegExp("@" + DOMAIN.replace(".", "\\.") + "$") }, "user accounts (students/parents/teachers)");

  const tagRe = new RegExp("^" + CONTENT_TAG.replace(/[[\]]/g, "\\$&"));
  total += await deleteInBatches(Homework, { title: tagRe }, "homework");
  total += await deleteInBatches(Assignment, { title: tagRe }, "assignments");
  total += await deleteInBatches(Announcement, { title: tagRe }, "announcements");
  total += await deleteInBatches(Event, { title: tagRe }, "events");
  total += await deleteInBatches(Admission, { notes: `${CONTENT_TAG} lead` }, "admission leads");

  // A class is only removed if it now has ZERO students left - so a class
  // this script reused (e.g. an existing "Grade 9" with real students
  // already in it) is never touched, even though this script also added
  // students to it.
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
