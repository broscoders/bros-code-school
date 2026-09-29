/**
 * Bro's Code - CAPACITY / VOLUME TEST CLEANUP
 *
 * Removes ONLY what seedVolumeTest.ts added:
 *   - Students whose admissionNumber starts with "VOLTEST-"
 *   - their Invoices, Attendance, Results
 *   - Parents and User accounts with an @loadtest.broscode.internal email
 *   - the synthetic "VolTest ..." classes/sections/subjects/exams and the
 *     "VolTest Session" academic session
 *
 * Nothing else is touched - no real student, class, invoice, or any other
 * record from the school is matched by these patterns.
 *
 * Run (from the server folder): npx tsx src/scripts/volumetest/cleanVolumeTest.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../../models/Student";
import User from "../../models/User";
import Parent from "../../models/Parent";
import Invoice from "../../models/Invoice";
import Attendance from "../../models/Attendance";
import Exam from "../../models/Exam";
import Result from "../../models/Result";
import ClassModel from "../../models/ClassModel";
import Section from "../../models/Section";
import Subject from "../../models/Subject";
import AcademicSession from "../../models/AcademicSession";
import Teacher from "../../models/Teacher";
import { confirmOrExit } from "./shared";

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
  await confirmOrExit("DELETE all load-test (VOLTEST) data added by seedVolumeTest.ts", uri);
  await mongoose.connect(uri);

  const studentIds = (await Student.find({ admissionNumber: /^VOLTEST-/ }).select("_id")).map((s) => s._id);
  console.log(`Found ${studentIds.length} load-test students.`);

  let total = 0;
  total += await deleteInBatches(Invoice, { studentId: { $in: studentIds } }, "invoices");
  total += await deleteInBatches(Attendance, { studentId: { $in: studentIds } }, "attendance");
  total += await deleteInBatches(Result, { studentId: { $in: studentIds } }, "results");
  total += await deleteInBatches(Student, { admissionNumber: /^VOLTEST-/ }, "students");
  total += await deleteInBatches(Parent, { userId: { $in: (await User.find({ email: /@loadtest\.broscode\.internal$/ }).select("_id")).map((u) => u._id) } }, "parents");
  total += await deleteInBatches(User, { email: /@loadtest\.broscode\.internal$/ }, "users (students/parents/bot teacher)");
  total += await deleteInBatches(Teacher, { employeeId: "VOLTEST-BOT" }, "bot teacher record");
  total += await deleteInBatches(Exam, { name: "VolTest Exam" }, "exams");
  total += await deleteInBatches(Subject, { name: "VolTest Subject" }, "subjects");
  total += await deleteInBatches(Section, { name: "V1", classId: { $in: (await ClassModel.find({ name: /^VolTest Grade/ }).select("_id")).map((c) => c._id) } }, "sections");
  total += await deleteInBatches(ClassModel, { name: /^VolTest Grade/ }, "classes");
  total += await deleteInBatches(AcademicSession, { name: "VolTest Session" }, "academic session");

  console.log(`\nDone. Removed ${total} load-test records. Your school's real data was not touched.`);
  await mongoose.disconnect();
})().catch((e) => { console.error("CLEANUP FAILED:", e); process.exit(1); });
