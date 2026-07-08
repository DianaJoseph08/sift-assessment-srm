import { DatabaseSync } from "node:sqlite";

const dbPath = "D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/server/sift.db";
const db = new DatabaseSync(dbPath);

console.log("Retrieving full candidate details...");
try {
  const query = db.prepare("SELECT * FROM candidates WHERE label LIKE '%Diana%'");
  const rows = query.all();
  for (const r of rows) {
    console.log("Candidate Row:", {
      id: r.id,
      label: r.label,
      status: r.status,
      // Print first 200 chars of result to see overall score
      resultSummary: r.result ? JSON.stringify(JSON.parse(r.result)).slice(0, 150) + "..." : null,
      interview: r.interview ? JSON.stringify(JSON.parse(r.interview)) : null
    });
  }
} catch (e) {
  console.error("Query failed:", e.message);
}
