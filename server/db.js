import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Persistent database location for Google Cloud (Cloud Storage volume mount or environment variable)
const bundledDbPath = path.join(__dirname, "..", "sift.db");
const persistentDir = process.env.DATA_DIR || (fs.existsSync("/app/data") ? "/app/data" : null);

let dbPath = process.env.DB_PATH;
if (!dbPath) {
  if (persistentDir) {
    if (!fs.existsSync(persistentDir)) {
      try { fs.mkdirSync(persistentDir, { recursive: true }); } catch (e) {}
    }
    dbPath = path.join(persistentDir, "sift.db");
    // Seed persistent directory with pre-existing database if it doesn't exist yet
    if (!fs.existsSync(dbPath) && fs.existsSync(bundledDbPath)) {
      try {
        fs.copyFileSync(bundledDbPath, dbPath);
        console.log(`[db] Seeded initial database to persistent volume at: ${dbPath}`);
      } catch (err) {
        console.warn(`[db] Failed to seed database to ${dbPath}:`, err.message);
      }
    }
  } else {
    dbPath = bundledDbPath;
  }
}

console.log(`[db] Connected to SQLite database at: ${dbPath}`);

// Initialize database
const db = new DatabaseSync(dbPath);

// Create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    contact_email TEXT,
    notes TEXT,
    created_at TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    company_name TEXT,
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

// Migration safeguard for existing DBs without company_id / company_name
try {
  db.exec("ALTER TABLE jobs ADD COLUMN company_id TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE jobs ADD COLUMN company_name TEXT");
} catch (e) {}

// ONE-TIME FIX: Restore orphaned jobs to their correct UI companies
try {
  db.exec(`
    UPDATE jobs SET company_id = 'comp_1787736442089', company_name = 'SRM Group of Institutions' WHERE company_id = 'comp_srmtech';
    UPDATE jobs SET company_id = 'comp_1787762242113', company_name = 'Motherson' WHERE company_id = 'comp_motherson';
  `);
} catch (e) {}


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

db.exec(`
  CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    type TEXT,
    message TEXT,
    company_name TEXT,
    details TEXT
  );
`);

/**
 * Companies Management
 */
export function getCompanies() {
  const query = db.prepare("SELECT * FROM companies ORDER BY rowid DESC");
  const rows = query.all();
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    industry: r.industry || "General",
    contactEmail: r.contact_email || "",
    notes: r.notes || "",
    createdAt: r.created_at || new Date().toISOString()
  }));
}

export function saveCompanies(companies) {
  db.exec("BEGIN TRANSACTION");
  try {
    db.exec("DELETE FROM companies");
    const insert = db.prepare(`
      INSERT INTO companies (id, name, industry, contact_email, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const c of companies) {
      insert.run(c.id, c.name, c.industry || "", c.contactEmail || "", c.notes || "", c.createdAt || new Date().toISOString());
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

/**
 * Activity Logs
 */
export function getLogs() {
  const query = db.prepare("SELECT * FROM activity_logs ORDER BY rowid DESC LIMIT 200");
  const rows = query.all();
  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    type: r.type,
    message: r.message,
    companyName: r.company_name || "",
    details: r.details || ""
  }));
}

export function addLog(type, message, companyName = "", details = "") {
  try {
    const insert = db.prepare(`
      INSERT INTO activity_logs (id, timestamp, type, message, company_name, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const timestamp = new Date().toISOString();
    insert.run(id, timestamp, type, message, companyName, details);
  } catch (e) {
    console.error("Failed to insert log:", e.message);
  }
}

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
    
    let resolvedCompId = job.company_id;
    let resolvedCompName = job.company_name;

    return {
      id: job.id,
      companyId: resolvedCompId,
      companyName: resolvedCompName,
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
      INSERT INTO jobs (id, company_id, company_name, title, seniority, minYears, location, description, mustHave, niceToHave, screening)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertCandidate = db.prepare(`
      INSERT INTO candidates (id, job_id, kind, filename, base64, text, label, status, result, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const job of jobs) {
      insertJob.run(
        job.id,
        job.companyId || "comp_default",
        job.companyName || "General Client",
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
