import { DatabaseSync } from "node:sqlite";

const dbPath = "D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/server/sift.db";
const db = new DatabaseSync(dbPath);

console.log("Searching for candidates with score 60...");
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
    if (score === 60 || (typeof score === "string" && score.includes("60"))) {
      console.log(`ID: ${r.id} | Label: ${r.label} | Score: ${score} | Rec: ${recommendation}`);
      console.log("Result:", r.result);
      console.log("Interview:", r.interview);
    }
  }
} catch (e) {
  console.error("Query failed:", e.message);
}
