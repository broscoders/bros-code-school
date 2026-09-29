import readline from "readline";
export const TAG_PREFIX = "DC-";              // admission numbers: DC-0001, DC-0002, ...
export const DOMAIN = "demo.brosschool.local"; // every user this script creates uses this email domain
export const CONTENT_TAG = "[Demo Data]";      // prefix on homework/announcement/event titles
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
