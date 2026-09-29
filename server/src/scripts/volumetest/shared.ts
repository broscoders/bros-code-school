import readline from "readline";
export const TAG = "VOLTEST-";
export const PASSWORD = "Test@123";

export function dbNameFromUri(uri: string): string {
  try { return new URL(uri).pathname.replace("/", "") || "(default: test)"; } catch { return "(unknown)"; }
}
export function hostFromUri(uri: string): string {
  try { return new URL(uri).host; } catch { return "(unknown)"; }
}
export async function confirmOrExit(action: string, uri: string): Promise<void> {
  console.log("\n==============================================");
  console.log(` ACTION   : ${action}`);
  console.log(` DB HOST  : ${hostFromUri(uri)}`);
  console.log(` DB NAME  : ${dbNameFromUri(uri)}`);
  console.log("==============================================");
  if (process.env.CONFIRM === "YES") return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise((res) => rl.question("Type CONFIRM to continue (anything else cancels): ", res));
  rl.close();
  if (answer.trim() !== "CONFIRM") { console.log("Cancelled. Nothing was changed."); process.exit(0); }
}
// Approximate current database size in MB. Tries the real command first
// (works on Atlas / real MongoDB); if it's unsupported (e.g. some
// MongoDB-compatible engines), falls back to summing collStats per
// collection, and finally to counting documents if even that fails.
export async function dbSizeMB(db: import("mongodb").Db): Promise<{ mb: number; source: string }> {
  try {
    const stats: any = await db.command({ dbStats: 1 });
    if (typeof stats.dataSize === "number") return { mb: stats.dataSize / (1024 * 1024), source: "dbStats" };
  } catch { /* fall through */ }
  try {
    const cols = await db.listCollections().toArray();
    let total = 0;
    for (const c of cols) {
      try {
        const s: any = await db.command({ collStats: c.name });
        total += s.size || 0;
      } catch { /* skip collections that don't support collStats */ }
    }
    if (total > 0) return { mb: total / (1024 * 1024), source: "collStats sum" };
  } catch { /* fall through */ }
  return { mb: -1, source: "unavailable" };
}
