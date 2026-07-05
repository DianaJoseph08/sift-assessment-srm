import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "sift.db");

// Initialize database
const db = new DatabaseSync(dbPath);

// Create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT,
    seniority TEXT,
    minYears INTEGER,
    location TEXT,
    description TEXT,
    mustHave TEXT, -- JSON stringified array
    niceToHave TEXT, -- JSON stringified array
    screening TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    kind TEXT,
    filename TEXT,
    base64 TEXT,
    text TEXT,
    label TEXT,
    status TEXT,
    result TEXT, -- JSON stringified object
    error TEXT,
    FOREIGN KEY(job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );
`);

/**
 * Retrieve all jobs, joining candidates per job.
 */
export function getJobs() {
  const jobsQuery = db.prepare("SELECT * FROM jobs ORDER BY rowid ASC");
  const jobsList = jobsQuery.all();
  
  const candidatesQuery = db.prepare("SELECT * FROM candidates WHERE job_id = ? ORDER BY rowid ASC");
  
  return jobsList.map((job) => {
    const dbCandidates = candidatesQuery.all(job.id);
    const parsedCandidates = dbCandidates.map((c) => ({
      id: c.id,
      kind: c.kind,
      filename: c.filename || undefined,
      base64: null, // Omit base64 content when sending to client to keep payload lightweight
      text: c.text || undefined,
      label: c.label,
      status: c.status,
      result: c.result ? JSON.parse(c.result) : null,
      error: c.error || null,
    }));
    
    return {
      id: job.id,
      title: job.title || "",
      seniority: job.seniority || "Senior",
      minYears: Number(job.minYears || 0),
      location: job.location || "",
      description: job.description || "",
      mustHave: job.mustHave ? JSON.parse(job.mustHave) : [],
      niceToHave: job.niceToHave ? JSON.parse(job.niceToHave) : [],
      candidates: parsedCandidates,
      screening: job.screening || "idle",
    };
  });
}

/**
 * Overwrite the database with the current frontend jobs array.
 * We pull and preserve existing candidates' base64 values so that they are not lost when client state updates.
 */
export function saveJobs(jobs) {
  // Query and map all existing candidates' non-null base64 values
  const existingBase64 = {};
  try {
    const selectBase64 = db.prepare("SELECT id, base64 FROM candidates WHERE base64 IS NOT NULL");
    const rows = selectBase64.all();
    for (const r of rows) {
      existingBase64[r.id] = r.base64;
    }
  } catch (e) {
    // Table might not exist or be empty on first load, which is fine
  }

  db.exec("BEGIN TRANSACTION");
  try {
    // Clear existing jobs and candidates
    db.exec("DELETE FROM candidates");
    db.exec("DELETE FROM jobs");
    
    const insertJob = db.prepare(`
      INSERT INTO jobs (id, title, seniority, minYears, location, description, mustHave, niceToHave, screening)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertCandidate = db.prepare(`
      INSERT INTO candidates (id, job_id, kind, filename, base64, text, label, status, result, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const job of jobs) {
      insertJob.run(
        job.id,
        job.title || "",
        job.seniority || "",
        job.minYears || 0,
        job.location || "",
        job.description || "",
        JSON.stringify(job.mustHave || []),
        JSON.stringify(job.niceToHave || []),
        job.screening || "idle"
      );
      
      if (job.candidates && Array.isArray(job.candidates)) {
        for (const c of job.candidates) {
          const b64 = c.base64 || existingBase64[c.id] || null;
          insertCandidate.run(
            c.id,
            job.id,
            c.kind || "text",
            c.filename || null,
            b64,
            c.text || null,
            c.label || "",
            c.status || "idle",
            c.result ? JSON.stringify(c.result) : null,
            c.error || null
          );
        }
      }
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/**
 * Fetch a single candidate by ID, including base64 contents.
 */
export function getCandidate(id) {
  const query = db.prepare("SELECT * FROM candidates WHERE id = ?");
  const row = query.get(id);
  if (!row) return null;
  return {
    id: row.id,
    jobId: row.job_id,
    kind: row.kind,
    filename: row.filename || null,
    base64: row.base64 || null,
    text: row.text || null,
    label: row.label,
    status: row.status,
    result: row.result ? JSON.parse(row.result) : null,
    error: row.error || null,
  };
}

export function saveCandidateInterview(id, interviewData) {
  const selectQuery = db.prepare("SELECT result FROM candidates WHERE id = ?");
  const row = selectQuery.get(id);
  if (!row) throw new Error("Candidate not found");

  let resultObj = {};
  if (row.result) {
    try {
      resultObj = JSON.parse(row.result);
    } catch (e) {}
  }

  resultObj.interview = interviewData;

  const updateQuery = db.prepare("UPDATE candidates SET result = ?, status = 'done' WHERE id = ?");
  updateQuery.run(JSON.stringify(resultObj), id);
}
