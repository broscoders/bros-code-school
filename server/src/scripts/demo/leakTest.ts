/**
 * Bro's Code - MULTI-SCHOOL DATA LEAK TEST
 *
 * Logs in as users of each DEMO school (created by seedDemo.ts) and checks that
 *   1. no API response ever contains another school's ids, emails or admission numbers
 *   2. direct access to another school's records (by id) is refused
 *   3. a parent / student cannot open other families' records in the SAME school
 * It only READS and makes a few harmless write attempts that must be refused.
 *
 * Run (from the server folder), server must be running:
 *   API_URL=http://localhost:5000/api npx tsx src/scripts/demo/leakTest.ts
 *   API_URL=https://YOUR-DEPLOYED-API/api npx tsx src/scripts/demo/leakTest.ts
 * Note: login is rate-limited (20 / 15 min per IP). One run uses 5 logins per school.
 */
import fs from "fs";
import path from "path";
import { DEMO_PASSWORD, emailDomain } from "./demoShared";

const API = (process.env.API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const SCHOOLS = Number(process.env.DEMO_SCHOOLS || 3);
const ENDPOINTS: string[] = JSON.parse(fs.readFileSync(path.join(__dirname, "endpoints.json"), "utf8"));

type Res = { status: number; text: string; json: any };
async function call(method: string, p: string, token?: string, body?: any): Promise<Res> {
  try {
    const res = await fetch(API + p, { method, signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch {}
    return { status: res.status, text, json };
  } catch (e) {
    // network error / timeout: report it, do not crash the whole run
    console.log(`  (no response) ${method} ${p}: ${(e as Error).message}`);
    return { status: 0, text: "", json: null };
  }
}
const arr = (j: any): any[] => (Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : Array.isArray(j?.items) ? j.items : []);

const findings: string[] = [];
let checks = 0, requests = 0, skipped = 0;
const leak = (msg: string) => { findings.push(msg); console.log("  LEAK  " + msg); };
const ok = () => { checks++; };

async function login(email: string): Promise<string> {
  const r = await call("POST", "/auth/login", undefined, { email, password: DEMO_PASSWORD });
  if (!r.json?.token) throw new Error(`Login failed for ${email}: HTTP ${r.status} ${r.json?.message || r.text.slice(0, 100)}`);
  return r.json.token;
}

(async () => {
  console.log(`Leak test against ${API}  (${SCHOOLS} demo schools)\n`);
  const roles = ["admin", "accountant", "teacher1", "parent1", "student1"];
  const tok: Record<number, Record<string, string>> = {};
  for (let k = 1; k <= SCHOOLS; k++) {
    tok[k] = {};
    for (const r of roles) tok[k][r] = await login(`${r}@${emailDomain(k)}`);
  }
  console.log(`Logged in ${SCHOOLS * roles.length} users.\n`);

  // ---- collect each school's own ids (as seen by that school's admin)
  const ids: Record<number, { all: Set<string>; students: string[]; invoices: string[]; classes: string[]; exams: string[] }> = {};
  for (let k = 1; k <= SCHOOLS; k++) {
    const t = tok[k].admin;
    const students = arr((await call("GET", "/people/students", t)).json);
    const teachers = arr((await call("GET", "/people/teachers", t)).json);
    const classes = arr((await call("GET", "/academics/classes", t)).json);
    const sections = arr((await call("GET", "/academics/sections", t)).json);
    const invoices = arr((await call("GET", "/ops/invoices/all", t)).json);
    const exams = arr((await call("GET", `/ops/exams?classId=${classes[0]?._id}`, t)).json);
    ids[k] = { all: new Set<string>(), students: students.map((x) => x._id), invoices: invoices.map((x) => x._id), classes: classes.map((x) => x._id), exams: exams.map((x) => x._id) };
    [students, teachers, classes, sections, invoices].forEach((list) => list.forEach((x) => ids[k].all.add(String(x._id))));
    console.log(`School ${k}: students ${students.length}, teachers ${teachers.length}, classes ${classes.length}, invoices ${invoices.length}`);
    if (students.length === 0) leak(`School ${k}: admin sees 0 students - was the demo data seeded?`); else ok();
    const foreignAdm = students.filter((s) => !String(s.admissionNumber).startsWith(`S${k}-`));
    if (foreignAdm.length) leak(`School ${k} admin student list contains ${foreignAdm.length} foreign admission numbers`); else ok();
  }

  // ---- 1. scan every parameterless GET endpoint for foreign markers
  console.log("\n[1] Scanning GET endpoints for other schools' data...");
  for (let k = 1; k <= SCHOOLS; k++) {
    const foreignIds: string[] = [];
    const foreignMarks: RegExp[] = [];
    for (let j = 1; j <= SCHOOLS; j++) if (j !== k) {
      ids[j].all.forEach((x) => foreignIds.push(x));
      foreignMarks.push(new RegExp(`@s${j}\\.demo\\.broscode\\.test`), new RegExp(`"S${j}-\\d{4}"`), new RegExp(`DEMO - School ${j}\\b`));
    }
    for (const role of roles) {
      for (const ep of ENDPOINTS) {
        const r = await call("GET", ep, tok[k][role]);
        requests++;
        if (r.status !== 200) { skipped++; continue; }
        const hitMark = foreignMarks.find((re) => re.test(r.text));
        const hitId = foreignIds.find((id) => r.text.includes(id));
        if (hitMark || hitId) leak(`School ${k} ${role} GET ${ep} returned foreign data (${hitMark ? hitMark.source : "id " + hitId})`);
        else ok();
      }
    }
    console.log(`  school ${k}: done`);
  }

  // ---- 2. direct access to another school's records must be refused
  console.log("\n[2] Direct access to another school's records by id...");
  const refused = (s: number) => s === 403 || s === 404 || s === 401 || s === 400;
  for (let k = 1; k <= SCHOOLS; k++) {
    const j = k === SCHOOLS ? 1 : k + 1;
    const fStudent = ids[j].students[0], fInvoice = ids[j].invoices[0], fExam = ids[j].exams[0], fClass = ids[j].classes[0];
    const tests: [string, string, any][] = [
      ["GET", `/people/students/${fStudent}`, undefined],
      ["PUT", `/people/students/${fStudent}/status`, { status: "ACTIVE" }],
      ["PUT", `/ops/invoices/${fInvoice}/pay`, { amount: 1 }],
      ["GET", `/ops/results/by-exam/${fExam}`, undefined],
      ["PUT", `/ops/results/${fExam}/publish`, undefined],
      ["GET", `/ops/exams?classId=${fClass}`, undefined],
      ["GET", `/ops/homework?classId=${fClass}`, undefined],
      ["GET", `/ops/attendance?studentId=${fStudent}`, undefined],
      ["GET", `/ops/invoices?studentId=${fStudent}`, undefined],
    ];
    for (const role of ["admin", "accountant"]) {
      for (const [m, p, b] of tests) {
        const r = await call(m, p, tok[k][role], b);
        requests++;
        const emptyList = r.status === 200 && (arr(r.json).length === 0);
        if (refused(r.status) || emptyList) ok();
        else leak(`School ${k} ${role} ${m} ${p} (school ${j}'s record) -> HTTP ${r.status}, expected refusal`);
      }
    }
  }

  // ---- 3. same-school, different-family checks for parent and student
  console.log("\n[3] Parent / student cannot open other families' records (same school)...");
  for (let k = 1; k <= SCHOOLS; k++) {
    const mine = new Set<string>(arr((await call("GET", "/people/students", tok[k].parent1)).json).map((x) => x._id));
    const myStu = new Set<string>(arr((await call("GET", "/people/students", tok[k].student1)).json).map((x) => x._id));
    if (mine.size < 1 || mine.size > 3) leak(`School ${k} parent1 sees ${mine.size} students (expected 1-3)`); else ok();
    if (myStu.size > 1) leak(`School ${k} student1 sees ${myStu.size} students (expected only themself)`); else ok();
    const others = ids[k].students.filter((s) => !mine.has(s)).slice(0, 5);
    for (const sid of others) {
      for (const [who, t] of [["parent1", tok[k].parent1], ["student1", tok[k].student1]] as const) {
        for (const p of [`/people/students/${sid}`, `/ops/attendance?studentId=${sid}`, `/ops/invoices?studentId=${sid}`, `/ops/results?studentId=${sid}`]) {
          const r = await call("GET", p, t);
          requests++;
          const empty = r.status === 200 && arr(r.json).length === 0;
          if (who === "student1" && myStu.has(sid)) continue;
          if (refused(r.status) || empty) ok();
          else leak(`School ${k} ${who} GET ${p} (someone else's child) -> HTTP ${r.status}`);
        }
      }
    }
    for (const [who, t] of [["parent1", tok[k].parent1], ["student1", tok[k].student1], ["teacher1", tok[k].teacher1]] as const) {
      for (const p of ["/finance/summary", "/hr/payroll", "/people/parents", "/audit", "/ops/invoices/all"]) {
        const r = await call("GET", p, t);
        requests++;
        if (r.status === 200 && who !== "teacher1" || (r.status === 200 && ["/finance/summary", "/hr/payroll", "/audit"].includes(p))) leak(`School ${k} ${who} can open admin-only ${p} (HTTP 200)`); else ok();
      }
    }
  }

  console.log("\n==================== RESULT ====================");
  console.log(`Requests sent: ${requests} | checks passed: ${checks} | leaks found: ${findings.length} | endpoints not reachable (non-200, skipped): ${skipped}`);
  if (findings.length === 0) console.log("PASS: no cross-school or cross-family data leak detected.");
  else { console.log("FAIL:"); findings.forEach((f) => console.log(" - " + f)); process.exit(1); }
})().catch((e) => { console.error("LEAK TEST ERROR:", e.message || e); process.exit(2); });
