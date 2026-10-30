import { hashPassword, verifyPassword } from "./passwords.js";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Persistent database location for Google Cloud (Cloud Storage volume mount or environment variable)
const bundledDbPath = path.join(__dirname, "..", "sift.db");
const persistentDir = process.env.DATA_DIR || (fs.existsSync("/app/data") ? "/app/data" : null);
const persistentDbPath = persistentDir ? path.join(persistentDir, "sift.db") : null;

// Determine active working database location:
// On Cloud Run with GCS FUSE volume mounts (/app/data), GCS FUSE does NOT support POSIX
// file locks or byte-range random writes required by SQLite.
// Therefore, we run SQLite on a local POSIX filesystem (/tmp/sift.db) and continuously sync to /app/data.
let activeDbPath;

if (process.env.DB_PATH) {
  activeDbPath = process.env.DB_PATH;
} else if (persistentDir) {
  activeDbPath = path.join("/tmp", "sift.db");
  try {
    if (!fs.existsSync(persistentDir)) {
      try { fs.mkdirSync(persistentDir, { recursive: true }); } catch (e) {}
    }
    // Check if persistent database exists and has content in the Cloud Storage bucket
    if (fs.existsSync(persistentDbPath) && fs.statSync(persistentDbPath).size > 0) {
      fs.copyFileSync(persistentDbPath, activeDbPath);
      console.log(`[db] Restored existing database from Cloud Storage bucket: ${persistentDbPath} -> ${activeDbPath} (${fs.statSync(activeDbPath).size} bytes)`);
    } else if (fs.existsSync(bundledDbPath)) {
      // Seed /tmp from bundled database
      fs.copyFileSync(bundledDbPath, activeDbPath);
      console.log(`[db] Seeded initial database to /tmp from bundled template: ${bundledDbPath}`);
      // Also write initial copy to persistent bucket
      try {
        fs.copyFileSync(bundledDbPath, persistentDbPath);
        console.log(`[db] Initialized Cloud Storage bucket with bundled database: ${persistentDbPath}`);
      } catch (err) {
        console.warn(`[db] Warning: Could not write initial seed to persistent volume:`, err.message);
      }
    }
  } catch (err) {
    console.warn(`[db] Error during persistent storage initialization:`, err.message);
    if (!fs.existsSync(activeDbPath) && fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, activeDbPath);
    }
  }
} else {
  // Local environment or container without volume mount
  activeDbPath = bundledDbPath;
}

console.log(`[db] Connected to SQLite database at: ${activeDbPath}`);
if (persistentDbPath) {
  console.log(`[db] Persistent Cloud Storage sync enabled: -> ${persistentDbPath}`);
} else {
  console.log(`[db] Notice: No persistent volume mounted at /app/data. Running locally.`);
}

/**
 * Synchronize local SQLite database to persistent volume (Cloud Storage bucket)
 */
let syncTimeout = null;

export function syncToPersistentStorage(immediate = false) {
  if (!persistentDbPath || activeDbPath === persistentDbPath) return;

  const performSync = () => {
    try {
      if (!fs.existsSync(persistentDir)) {
        try { fs.mkdirSync(persistentDir, { recursive: true }); } catch (e) {}
      }
      try {
        db.exec("PRAGMA wal_checkpoint(PASSIVE)");
      } catch (e) {}
      fs.copyFileSync(activeDbPath, persistentDbPath);
      console.log(`[db] Synced database to persistent Cloud Storage volume at: ${persistentDbPath}`);
    } catch (err) {
      console.error(`[db] Failed to sync database to persistent volume (${persistentDbPath}):`, err.message);
    }
  };

  if (immediate) {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }
    performSync();
  } else {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(performSync, 1000);
  }
}

// Initialize database with resilient fallback
let db;
try {
  db = new DatabaseSync(activeDbPath);
} catch (err) {
  console.error(`[db] Critical: Could not open database at ${activeDbPath}:`, err.message);
  activeDbPath = path.join("/tmp", `sift_fallback_${Date.now()}.db`);
  try {
    if (fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, activeDbPath);
      console.log(`[db] Recovered using clean bundled template at: ${activeDbPath}`);
    }
  } catch (copyErr) {
    console.warn(`[db] Could not copy bundled template:`, copyErr.message);
  }
  db = new DatabaseSync(activeDbPath);
}

// Create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT,
    contact_email TEXT,
    sender_name TEXT,
    notes TEXT,
    created_at TEXT
  );
`);

// Migration safeguard for existing DBs without sender_name
try {
  db.exec("ALTER TABLE companies ADD COLUMN sender_name TEXT");
} catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS clusters (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'super_admin', 'manager', 'recruiter'
    customer_id TEXT,
    cluster_id TEXT,
    created_by TEXT,
    created_at TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    company_id TEXT,
    company_name TEXT,
    cluster_id TEXT,
    client_manager_name TEXT,
    status TEXT DEFAULT 'draft',
    posted_at TEXT,
    closed_at TEXT,
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

// Migration safeguards for existing DBs
try { db.exec("ALTER TABLE jobs ADD COLUMN company_id TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE jobs ADD COLUMN company_name TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE jobs ADD COLUMN cluster_id TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE jobs ADD COLUMN client_manager_name TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE jobs ADD COLUMN status TEXT DEFAULT 'draft'"); } catch (e) {}
try { db.exec("ALTER TABLE jobs ADD COLUMN posted_at TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE jobs ADD COLUMN closed_at TEXT"); } catch (e) {}

// For existing legacy jobs without status, set them to 'posted' so they remain accessible
try {
  db.exec("UPDATE jobs SET status = 'posted' WHERE status IS NULL OR status = ''");
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

db.exec(`
  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

/**
 * System Settings Key-Value Store
 */
export function getSetting(key) {
  try {
    const q = db.prepare("SELECT value FROM system_settings WHERE key = ?");
    const row = q.get(key);
    return row ? row.value : null;
  } catch (e) {
    return null;
  }
}

export function saveSetting(key, value) {
  try {
    const q = db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)");
    q.run(key, value);
    syncToPersistentStorage(true);
  } catch (e) {
    console.error(`Failed to save setting ${key}:`, e.message);
  }
}

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
    senderName: r.sender_name || "",
    notes: r.notes || "",
    createdAt: r.created_at || new Date().toISOString()
  }));
}

export function saveCompanies(companies) {
  db.exec("BEGIN TRANSACTION");
  try {
    db.exec("DELETE FROM companies");
    const insert = db.prepare(`
      INSERT INTO companies (id, name, industry, contact_email, sender_name, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of companies) {
      insert.run(
        c.id,
        c.name,
        c.industry || "",
        c.contactEmail || "",
        c.senderName || "",
        c.notes || "",
        c.createdAt || new Date().toISOString()
      );
    }
    db.exec("COMMIT");
    syncToPersistentStorage(true);
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
    syncToPersistentStorage(false);
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
      clusterId: job.cluster_id || "",
      clientManagerName: job.client_manager_name || "",
      status: job.status || "posted",
      postedAt: job.posted_at || null,
      closedAt: job.closed_at || null,
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
      INSERT INTO jobs (id, company_id, company_name, cluster_id, client_manager_name, status, posted_at, closed_at, title, seniority, minYears, location, description, mustHave, niceToHave, screening)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        job.clusterId || null,
        job.clientManagerName || null,
        job.status || "draft",
        job.postedAt || (job.status === "posted" ? new Date().toISOString() : null),
        job.closedAt || null,
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
    syncToPersistentStorage(true);
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
  syncToPersistentStorage(true);
}

/**
 * Clusters Management
 */
export function getClusters(customerId = null) {
  try {
    let query;
    if (customerId) {
      query = db.prepare("SELECT * FROM clusters WHERE customer_id = ? ORDER BY rowid ASC");
      return query.all(customerId).map(r => ({
        id: r.id,
        customerId: r.customer_id,
        name: r.name,
        description: r.description || "",
        createdAt: r.created_at || new Date().toISOString()
      }));
    } else {
      query = db.prepare("SELECT * FROM clusters ORDER BY rowid ASC");
      return query.all().map(r => ({
        id: r.id,
        customerId: r.customer_id,
        name: r.name,
        description: r.description || "",
        createdAt: r.created_at || new Date().toISOString()
      }));
    }
  } catch (e) {
    console.error("Failed to get clusters:", e.message);
    return [];
  }
}

export function createCluster({ id, customerId, name, description }) {
  const insert = db.prepare(`
    INSERT INTO clusters (id, customer_id, name, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const clusterId = id || `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const createdAt = new Date().toISOString();
  insert.run(clusterId, customerId, name, description || "", createdAt);
  syncToPersistentStorage(true);
  return { id: clusterId, customerId, name, description: description || "", createdAt };
}

export function deleteCluster(clusterId) {
  const del = db.prepare("DELETE FROM clusters WHERE id = ?");
  del.run(clusterId);
  syncToPersistentStorage(true);
  return { ok: true };
}

/**
 * Users & Roles Management
 */
export function getUsers(filter = {}) {
  try {
    let sql = "SELECT id, name, email, role, customer_id, cluster_id, created_by, created_at FROM users";
    const params = [];
    const clauses = [];

    if (filter.role) {
      clauses.push("role = ?");
      params.push(filter.role);
    }
    if (filter.customerId) {
      clauses.push("customer_id = ?");
      params.push(filter.customerId);
    }
    if (filter.clusterId) {
      clauses.push("cluster_id = ?");
      params.push(filter.clusterId);
    }

    if (clauses.length > 0) {
      sql += " WHERE " + clauses.join(" AND ");
    }
    sql += " ORDER BY rowid ASC";

    const q = db.prepare(sql);
    const rows = q.all(...params);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      customerId: r.customer_id,
      clusterId: r.cluster_id,
      createdBy: r.created_by,
      createdAt: r.created_at
    }));
  } catch (e) {
    console.error("Failed to get users:", e.message);
    return [];
  }
}

export function getUserById(id) {
  try {
    const q = db.prepare("SELECT id, name, email, role, customer_id, cluster_id, created_by, created_at FROM users WHERE id = ?");
    const r = q.get(id);
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      customerId: r.customer_id,
      clusterId: r.cluster_id,
      createdBy: r.created_by,
      createdAt: r.created_at
    };
  } catch (e) {
    return null;
  }
}

export function getUserByEmail(email) {
  try {
    const q = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)");
    return q.get(email) || null;
  } catch (e) {
    return null;
  }
}

export function createUser({ id, name, email, password, role, customerId, clusterId, createdBy }) {
  const insert = db.prepare(`
    INSERT INTO users (id, name, email, password, role, customer_id, cluster_id, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const userId = id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const createdAt = new Date().toISOString();
  insert.run(
    userId,
    name,
    email.trim().toLowerCase(),
    hashPassword(password),
    role,
    customerId || null,
    clusterId || null,
    createdBy || null,
    createdAt
  );
  syncToPersistentStorage(true);
  return { id: userId, name, email: email.trim().toLowerCase(), role, customerId, clusterId, createdBy, createdAt };
}

export function deleteUser(id) {
  const del = db.prepare("DELETE FROM users WHERE id = ?");
  del.run(id);
  syncToPersistentStorage(true);
  return { ok: true };
}

export function upsertSuperAdmin({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  const existing = getUserByEmail(cleanEmail);
  if (existing) {
    const update = db.prepare(`
      UPDATE users SET name = ?, password = ?, role = 'super_admin' WHERE id = ?
    `);
    update.run(name || existing.name || "Motherson Super Admin", hashPassword(password), existing.id);
    syncToPersistentStorage(true);
    return {
      id: existing.id,
      name: name || existing.name || "Motherson Super Admin",
      email: cleanEmail,
      role: 'super_admin',
      customerId: null,
      clusterId: null,
      createdBy: existing.created_by,
      createdAt: existing.created_at
    };
  } else {
    return createUser({
      name: name || "Motherson Super Admin",
      email: cleanEmail,
      password,
      role: "super_admin",
      createdBy: "self_setup"
    });
  }
}

export function authenticateUser(email, password) {
  if (!email || !password) return null;
  const user = getUserByEmail(email);
  if (!user) return null;
  if (!verifyPassword(password, user.password)) return null;
  if (!user.password.startsWith('scrypt:')) {
    db.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(password),user.id);
    syncToPersistentStorage(true);
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    customerId: user.customer_id,
    clusterId: user.cluster_id,
    createdBy: user.created_by,
    createdAt: user.created_at
  };
}

/**
 * Initial System Seeding
 */
export function seedInitialAuthAndTenantData() {
  if(process.env.NODE_ENV==='production')return;
  try {
    const userCountQ = db.prepare("SELECT COUNT(*) as count FROM users");
    const count = userCountQ.get()?.count || 0;

    if (count === 0) {
      console.log("[db] Seeding initial Motherson Admin, Bosch customer, clusters, and users...");

      // 1. Motherson Super Admin
      createUser({
        id: "user_admin_motherson",
        name: "Motherson Group Admin",
        email: "admin@motherson.com",
        password: "admin123",
        role: "super_admin",
        customerId: null,
        clusterId: null,
        createdBy: "system"
      });

      // 2. Ensure Bosch customer exists
      const compQ = db.prepare("SELECT * FROM companies WHERE name LIKE '%Bosch%'");
      let bosch = compQ.get();
      if (!bosch) {
        bosch = {
          id: "comp_bosch",
          name: "Bosch Global Software & Engineering",
          industry: "Automotive & Industrial Technology",
          contact_email: "recruitment@bosch.com",
          sender_name: "Bosch Talent Acquisition",
          notes: "Global automotive and industrial electronics partner"
        };
        const insComp = db.prepare(`
          INSERT INTO companies (id, name, industry, contact_email, sender_name, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        insComp.run(bosch.id, bosch.name, bosch.industry, bosch.contact_email, bosch.sender_name, bosch.notes, new Date().toISOString());
      }

      // 3. Seed initial clusters for Bosch (Mechanical and SAP)
      const clusterMech = createCluster({
        id: "cluster_bosch_mech",
        customerId: bosch.id,
        name: "Mechanical",
        description: "Automotive chassis, powertrain, and thermal engineering"
      });

      createCluster({
        id: "cluster_bosch_sap",
        customerId: bosch.id,
        name: "SAP",
        description: "SAP ERP, S/4HANA, Supply Chain & Logistics solutions"
      });

      // 4. Seed Manager for Bosch Mechanical
      createUser({
        id: "user_manager_mech",
        name: "Klaus Richter",
        email: "manager.mech@bosch.com",
        password: "manager123",
        role: "manager",
        customerId: bosch.id,
        clusterId: clusterMech.id,
        createdBy: "user_admin_motherson"
      });

      // 5. Seed Recruiter for Bosch Mechanical
      createUser({
        id: "user_recruiter_mech",
        name: "Sarah Jenkins",
        email: "recruiter.mech@bosch.com",
        password: "recruiter123",
        role: "recruiter",
        customerId: bosch.id,
        clusterId: clusterMech.id,
        createdBy: "user_manager_mech"
      });

      // 6. Ensure existing jobs have cluster_id if unassigned
      try {
        db.exec(`UPDATE jobs SET cluster_id = '${clusterMech.id}', status = 'posted' WHERE cluster_id IS NULL OR cluster_id = ''`);
      } catch (e) {}

      console.log("[db] Initial auth & tenant data seeded successfully.");
    }
  } catch (err) {
    console.error("[db] Seeding error:", err.message);
  }
}

// Run initial seeding
seedInitialAuthAndTenantData();


export { db as database };
