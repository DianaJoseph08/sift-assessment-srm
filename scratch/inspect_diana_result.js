import { DatabaseSync } from "node:sqlite";

const dbPath = "D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/server/sift.db";
const db = new DatabaseSync(dbPath);

console.log("Retrieving Dianavinnarasi Joseph's evaluation...");
try {
  const query = db.prepare("SELECT label, result FROM candidates WHERE label LIKE '%Diana%'");
  const rows = query.all();
  for (const r of rows) {
    console.log(`Candidate: ${r.label}`);
    console.log(`JSON Result:\n`, JSON.stringify(JSON.parse(r.result), null, 2));
    console.log("-----------------------------------------");
  }
} catch (e) {
  console.error("Query failed:", e.message);
}
