import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const dbPath = "D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/server/sift.db";
const db = new DatabaseSync(dbPath);

console.log("Retrieving candidates status and errors from database...");
try {
  const query = db.prepare("SELECT id, label, status, error FROM candidates");
  const rows = query.all();
  console.log(`Found ${rows.length} candidates in database:`);
  for (const r of rows) {
    console.log(`Candidate ID: ${r.id}`);
    console.log(`  Name/Label: ${r.label}`);
    console.log(`  Status:     ${r.status}`);
    console.log(`  Error:      ${r.error || "None"}`);
    console.log("-----------------------------------------");
  }
} catch (e) {
  console.error("Database query failed:", e.message);
}
