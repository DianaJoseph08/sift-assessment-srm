import { DatabaseSync } from "node:sqlite";

const dbPath = "D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/server/sift.db";
const db = new DatabaseSync(dbPath);

console.log("Retrieving all candidates...");
try {
  const query = db.prepare("SELECT * FROM candidates");
  const rows = query.all();
  for (const r of rows) {
    let score = "N/A";
    let recommendation = "N/A";
    try {
      const res = JSON.parse(r.result);
      score = res.overallScore;
      recommendation = res.recommendation;
    } catch(e) {}
    console.log(`ID: ${r.id} | Label: ${r.label} | Score: ${score} | Rec: ${recommendation} | Status: ${r.status}`);
  }
} catch (e) {
  console.error("Query failed:", e.message);
}
