// Shared helpers for the demo seed / cleanup / leak-test scripts.
// Everything created by these scripts lives inside schools whose name starts
// with DEMO_PREFIX, so cleanup can never touch a real school.
import readline from "readline";

export const DEMO_PREFIX = "DEMO - ";
export const DEMO_PASSWORD = "Demo@123";
export const emailDomain = (k: number) => `s${k}.demo.broscode.test`;

export function dbNameFromUri(uri: string): string {
  try {
    const u = new URL(uri);
    return u.pathname.replace("/", "") || "(default: test)";
  } catch {
    return "(unknown)";
  }
}

export function hostFromUri(uri: string): string {
  try {
    return new URL(uri).host;
  } catch {
    return "(unknown)";
  }
}

// Interactive safety gate. Type CONFIRM, or set DEMO_CONFIRM=YES for CI/non-interactive use.
export async function confirmOrExit(action: string, uri: string): Promise<void> {
  console.log("\n==============================================");
  console.log(` ACTION   : ${action}`);
  console.log(` DB HOST  : ${hostFromUri(uri)}`);
  console.log(` DB NAME  : ${dbNameFromUri(uri)}`);
  console.log("==============================================");
  if (process.env.DEMO_CONFIRM === "YES") return;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer: string = await new Promise((res) => rl.question('Type CONFIRM to continue (anything else cancels): ', res));
  rl.close();
  if (answer.trim() !== "CONFIRM") {
    console.log("Cancelled. Nothing was changed.");
    process.exit(0);
  }
}
