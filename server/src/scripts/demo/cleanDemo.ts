/**
 * Bro's Code - DEMO DATA CLEANUP
 * Deletes ONLY schools whose name starts with "DEMO - " and everything that
 * belongs to them (matched by schoolId, plus exam results). Real schools are
 * never touched.
 *
 * Run (from the server folder):  npx tsx src/scripts/demo/cleanDemo.ts
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import School from "../../models/School";
import Exam from "../../models/Exam";
import Result from "../../models/Result";
import { DEMO_PREFIX, confirmOrExit } from "./demoShared";

dotenv.config();

(async () => {
  const uri = process.env.MONGODB_URI as string;
  if (!uri) { console.error("MONGODB_URI is not set."); process.exit(1); }
  await confirmOrExit("DELETE all DEMO schools and their data", uri);
  await mongoose.connect(uri);
  const demo = await School.find({ name: new RegExp("^" + DEMO_PREFIX) }).select("_id name");
  if (demo.length === 0) { console.log("No demo schools found. Nothing to delete."); await mongoose.disconnect(); return; }
  const ids = demo.map((s) => s._id);
  console.log("Deleting:", demo.map((s) => s.name).join(", "));

  // Results have no schoolId - remove them via the demo exams first.
  const examIds = (await Exam.find({ schoolId: { $in: ids } }).select("_id")).map((e) => e._id);
  for (let i = 0; i < examIds.length; i += 500) {
    const r = await Result.deleteMany({ examId: { $in: examIds.slice(i, i + 500) } });
    if (i === 0) console.log(`  results deleted (first batch): ${r.deletedCount}`);
  }
  const db = mongoose.connection.db!;
  const cols = await db.listCollections().toArray();
  let total = 0;
  for (const c of cols) {
    if (c.name === "schools") continue;
    const col = db.collection(c.name);
    let deleted = 0;
    try {
      deleted = (await col.deleteMany({ schoolId: { $in: ids } })).deletedCount || 0;
    } catch {
      // Some databases reject one huge delete: fall back to small batches by _id.
      for (;;) {
        const batch = await col.find({ schoolId: { $in: ids } }, { projection: { _id: 1 } }).limit(300).toArray();
        if (batch.length === 0) break;
        deleted += (await col.deleteMany({ _id: { $in: batch.map((b) => b._id) } })).deletedCount || 0;
      }
    }
    if (deleted) { console.log(`  ${c.name}: ${deleted}`); total += deleted; }
  }
  await School.deleteMany({ _id: { $in: ids } });
  console.log(`\nDone. Removed ${demo.length} demo school(s) and ${total} related records.`);
  await mongoose.disconnect();
})().catch((e) => { console.error("CLEANUP FAILED:", e); process.exit(1); });
