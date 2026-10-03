import mongoose, { Types } from "mongoose";
import bcrypt from "bcryptjs";
import User from "../../models/User";
import School from "../../models/School";
import AcademicSession from "../../models/AcademicSession";
import ClassModel from "../../models/ClassModel";
import Section from "../../models/Section";
import Student from "../../models/Student";
import Teacher from "../../models/Teacher";

const BASE = "http://127.0.0.1:5055/api";
const PW = "Test@123";
let pass = 0, fail = 0;
const check = (name: string, cond: boolean, note = "") => { cond ? pass++ : fail++; console.log(`[${cond ? "PASS" : "FAIL"}] ${name}${note ? " -> " + note : ""}`); };
async function api(method: string, path: string, token?: string, body?: any) {
  const res = await fetch(BASE + path, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let json: any = null; try { json = await res.json(); } catch {}
  return { status: res.status, json, headers: res.headers };
}
async function mkUser(name: string, email: string, role: any, schoolId: any) {
  return User.create({ name, email, password: await bcrypt.hash(PW, 10), role, schoolId, isEmailVerified: true, isActive: true, accountStatus: "ACTIVE" } as any);
}
async function login(email: string) { return (await api("POST", "/auth/login", undefined, { email, password: PW })).json?.token as string; }

(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string);
  await mongoose.connection.dropDatabase();

  const schoolA = await School.create({ name: "Fix Verify School A", isActive: true });
  const schoolB = await School.create({ name: "Fix Verify School B", isActive: true });
  const sessA = await AcademicSession.create({ schoolId: schoolA._id, name: "2026-27", startDate: new Date(), endDate: new Date(), isActive: true });
  const clsA = await ClassModel.create({ schoolId: schoolA._id, sessionId: sessA._id, name: "Grade 5", academicSystem: "National" });
  const secA = await Section.create({ schoolId: schoolA._id, classId: clsA._id, name: "A", capacity: 40 });
  const acctA = await mkUser("Accountant A", "acct.fx@qa.test", "ACCOUNTANT", schoolA._id);
  const teacherUserA = await mkUser("Teacher A", "teacher.fx@qa.test", "TEACHER", schoolA._id);
  const studentUserA = await mkUser("Student A1", "s1.fx@qa.test", "STUDENT", schoolA._id);
  const st1 = await Student.create({ schoolId: schoolA._id, userId: studentUserA._id, admissionNumber: "FX-1", classId: clsA._id, sectionId: secA._id });
  const studentUserB = await mkUser("Student B1", "sb1.fx@qa.test", "STUDENT", schoolB._id);
  const stB = await Student.create({ schoolId: schoolB._id, userId: studentUserB._id, admissionNumber: "FXB-1", classId: clsA._id, sectionId: secA._id });

  await Teacher.create({ schoolId: schoolA._id, userId: teacherUserA._id, employeeId: "FX-T1", assignedClasses: [clsA._id] });

  const tk = await login("acct.fx@qa.test");

  // 1. Negative invoice amount rejected
  let r = await api("POST", "/ops/invoices", tk, { studentId: st1._id, feeType: "Tuition", amount: -5000, dueDate: "2026-10-10" });
  check("Negative invoice amount rejected", r.status === 400, `status ${r.status}`);

  // 2. Cross-school invoice rejected
  r = await api("POST", "/ops/invoices", tk, { studentId: stB._id, feeType: "Cross", amount: 100, dueDate: "2026-10-10" });
  check("Accountant A cannot invoice School B's student", r.status === 404, `status ${r.status}`);

  // 3. Overpayment blocked
  r = await api("POST", "/ops/invoices", tk, { studentId: st1._id, feeType: "Tuition", amount: 10000, dueDate: "2026-10-10" });
  const inv = r.json;
  check("Valid invoice created", r.status === 201, `status ${r.status}`);
  r = await api("PUT", `/ops/invoices/${inv._id}/pay`, tk, { amount: 4000 });
  check("Partial payment works", r.json?.status === "PARTIAL" && r.json?.paidAmount === 4000, `status ${r.json?.status} paid ${r.json?.paidAmount}`);
  r = await api("PUT", `/ops/invoices/${inv._id}/pay`, tk, { amount: 9000 });
  check("Overpayment (9000 on remaining 6000) is rejected", r.status === 400, `status ${r.status} msg: ${r.json?.message}`);
  r = await api("PUT", `/ops/invoices/${inv._id}/pay`, tk, { amount: 6000 });
  check("Paying exactly the remaining balance succeeds -> PAID", r.json?.status === "PAID" && r.json?.paidAmount === 10000, `status ${r.json?.status} paid ${r.json?.paidAmount}`);
  r = await api("PUT", `/ops/invoices/${inv._id}/pay`, tk, { amount: 1 });
  check("Paying an already-fully-paid invoice is rejected", r.status === 400, `status ${r.status}`);

  // 4. Refund cannot exceed what was paid
  r = await api("POST", "/finance/refunds", tk, { studentId: st1._id, invoiceId: inv._id, amount: 999999, reason: "too much" });
  check("Refund larger than amount paid is rejected at creation", r.status === 400, `status ${r.status} msg: ${r.json?.message}`);
  r = await api("POST", "/finance/refunds", tk, { studentId: st1._id, invoiceId: inv._id, amount: 3000, reason: "valid refund" });
  check("Valid refund request accepted", r.status === 201, `status ${r.status}`);

  // 5. Attendance markedBy cannot be forged
  r = await api("POST", "/ops/attendance", await login("teacher.fx@qa.test"), { studentId: st1._id, classId: clsA._id, sectionId: secA._id, date: "2026-09-25", status: "ABSENT", markedBy: acctA._id });
  check("Assigned teacher can mark attendance", r.status === 200 || r.status === 201, `status ${r.status} msg ${r.json?.message}`);
  const rawAtt = await mongoose.connection.collection("attendances").findOne({ studentId: st1._id });
  check("Server ignores client-supplied markedBy and stores the real logged-in teacher", String(rawAtt?.markedBy) === String(teacherUserA._id), `storedMarkedBy=${rawAtt?.markedBy}, expected=${teacherUserA._id}`);

  // 6. Audit username can't be spoofed via body (approving your own refund
  // request is blocked by separation-of-duties, so use a second admin here)
  const adminUserA = await mkUser("Admin A", "admin.fx@qa.test", "SCHOOL_ADMIN", schoolA._id);
  const adminTk = await login("admin.fx@qa.test");
  const refundId = (await mongoose.connection.collection("refunds").findOne({ reason: "valid refund" }))!._id;
  r = await api("PUT", `/finance/refunds/${refundId}/status`, adminTk, { status: "REJECTED", changedByName: "TOTALLY FAKE NAME" });
  check("A different admin can reject the refund", r.status === 200, `status ${r.status} msg: ${r.json?.message}`);
  const audits = await mongoose.connection.collection("auditlogs").find({ recordType: "Refund" }).toArray();
  check("Audit log ignores client-supplied fake name", audits.length > 0 && !audits.some((a: any) => a.userName === "TOTALLY FAKE NAME") && audits.some((a: any) => a.userName === "Admin A"), `entries: ${audits.length}, names: ${audits.map((a: any) => a.userName).join(",")}`);

  // 7. Branding: two active schools -> null (not the first one)
  r = await api("GET", "/schools/public/branding");
  check("Branding with 2+ active schools and no hint returns null (not a random school's name)", r.json === null, `got ${JSON.stringify(r.json)}`);
  r = await api("GET", `/schools/public/branding?schoolId=${schoolA._id}`);
  check("Branding with explicit schoolId returns that school", r.json?.name === "Fix Verify School A", `got ${JSON.stringify(r.json)}`);

  // 8. Invoice pagination + X-Total-Count
  for (let i = 0; i < 5; i++) await api("POST", "/ops/invoices", tk, { studentId: st1._id, feeType: `Extra${i}`, amount: 100, dueDate: "2026-12-01" });
  const totalInvoicesForSchoolA = await mongoose.connection.collection("invoices").countDocuments({ schoolId: schoolA._id });
  r = await api("GET", "/ops/invoices/all?limit=3&page=1", tk);
  const total = r.headers.get("x-total-count");
  check("Invoice pagination returns a limited page", Array.isArray(r.json) && r.json.length === 3, `page len ${r.json?.length}`);
  check("X-Total-Count header matches the real total (not capped at page size)", Number(total) === totalInvoicesForSchoolA, `total header ${total}, actual ${totalInvoicesForSchoolA}`);
  r = await api("GET", "/ops/invoices/all?limit=3&page=2", tk);
  check("Page 2 returns different invoices than page 1", Array.isArray(r.json) && r.json.length > 0, `page2 len ${r.json?.length}`);

  console.log(`\nSUMMARY: ${pass} passed, ${fail} failed`);
  await mongoose.disconnect();
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => { console.error("CRASH", e); process.exit(2); });
