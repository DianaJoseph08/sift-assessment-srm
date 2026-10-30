import {sendWelcomeEmail,validRecipient,publicMailSettings,saveAccountMailSettings,verifyAccountMail} from './welcome-mail.js';
import {validateJobBatch} from './job-permissions.js';
import { randomBytes, createHash } from "node:crypto";
import { hashPassword } from './passwords.js';
import { createSession, sessionUser, endSession, ADMIN_EMAIL } from './security.js';
import { workflowRouter, canAccess, scopes, records, synchronizeScreeningWorkflow, jobReference } from './workflow.js';
import { interviewToken, validInterviewToken } from './interview-access.js';
// Watch reload trigger
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { analyzeResume, getNextInterviewQuestion, evaluateInterview, generateInterviewQuestions, evaluateVideoInterviewTranscript, compareCandidatesWithClaude } from "./analyze.js";
import {
  database, syncToPersistentStorage, getJobs, saveJobs, getCandidate, saveCandidateInterview,
  getCompanies, saveCompanies, getLogs, addLog, getSetting, saveSetting,
  getClusters, createCluster, deleteCluster,
  getUsers, getUserById, getUserByEmail, createUser, deleteUser, authenticateUser, upsertSuperAdmin
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

process.on("uncaughtException", (err) => {
  console.error("[CRITICAL] Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[CRITICAL] Unhandled rejection:", reason);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" })); // resumes are sent as base64
// Enforce staff sessions on every API route; public interviews use a signed candidate capability.
const loginAttempts=new Map();
const interviewAssessments=new Map();
const transcriptDigest=t=>createHash("sha256").update(JSON.stringify(t)).digest("hex");
app.use('/api', (req,res,next)=>{
  req.user=sessionUser(req);
  const publicPaths=['/auth/login','/auth/setup-admin','/auth/me','/auth/logout','/auth/setup-status','/health','/version'];
  if(publicPaths.includes(req.path))return next();
  if(!req.user){
    const id=req.headers['x-interview-candidate'];
    const token=req.headers['x-interview-token'];
    const allowed=['/jobs','/interview/video-questions','/interview/video-evaluate','/save-proctoring','/candidate-interview-info','/candidate-interview-submit'];
    if(allowed.includes(req.path)&&validInterviewToken(id,token)&&getCandidate(id)){
      if(req.body?.candidateId && req.body.candidateId!==id)return res.status(403).json({error:'Candidate mismatch'});
      if(req.query.candidateId && req.query.candidateId!==id)return res.status(403).json({error:'Candidate mismatch'});
      req.interviewCandidateId=id;
      if(req.path.startsWith('/interview/')){
        const c=getCandidate(id);const j=getJobs().find(j=>j.id===c.jobId);
        if(!j)return res.status(404).json({error:'Interview job not found'});
        if(j.status!=='posted')return res.status(409).json({error:'This job is no longer accepting interviews'});
        req.body.job={title:j.title,description:j.description,mustHave:j.mustHave};
        req.body.candidate={name:c.result?.candidateName||c.label};
        delete req.body.apiKey;
      }
      return next();
    }
    return res.status(401).json({error:'Sign in to access this resource'});
  }
  const recruiterActions=['/analyze','/send-interview-email','/interview/chat','/interview/video-questions','/interview/video-evaluate','/interview/evaluate','/save-proctoring','/candidate-interview-submit','/candidate-compare'];
  if(req.method==='POST'&&recruiterActions.includes(req.path)){
    if(req.user.role!=='recruiter')return res.status(403).json({error:'Recruiters handle resumes, screening and AI interviews. This role has review access.'});
    const candidateId=req.body.candidateId||req.body.resume?.candidateId||req.body.candidate?.id;
    const candidate=candidateId&&getCandidate(candidateId);
    const jobId=req.body.job?.id||req.body.jobId||candidate?.jobId;
    const job=getJobs().find(j=>j.id===jobId);
    if(!job||!canAccess(req.user,job))return res.status(403).json({error:'Choose a job in your assigned customer and cluster'});
    if(job.status!=='posted')return res.status(409).json({error:'Recruitment activity requires a posted job'});
    if(candidateId&&(!candidate||candidate.jobId!==job.id))return res.status(403).json({error:'Candidate does not belong to this job'});
    if(req.body.job)req.body.job=job;
    if(req.body.candidate&&candidate)req.body.candidate={id:candidate.id,name:candidate.result?.candidateName||candidate.label,label:candidate.label,result:candidate.result};
  }
  if(req.path==='/save-jobs'&&req.user.role==='super_admin')return res.status(403).json({error:'Super Admin monitors jobs and results. Only managers can create or post jobs.'});
  if(req.path.startsWith('/mail/')&&req.user.role!=='super_admin'&&req.path!=='/mail/status')return res.status(403).json({error:'Super Admin access required'});
  const adminOnly=['/save-companies','/settings','/logs','/clusters'];
  if(req.user.role!=='super_admin' && (adminOnly.includes(req.path) && req.method!=='GET' || req.path==='/logs'))return res.status(403).json({error:'Super Admin access required'});
  if(req.path.startsWith('/users')&&req.method!=='GET'&&req.user.role==='recruiter')return res.status(403).json({error:'Manager access required'});
  if(req.path==='/users'&&req.method==='POST'){
    if(!['super_admin','manager','recruiter'].includes(req.body.role))return res.status(400).json({error:'Invalid role'});
    if(req.user.role==='manager' && (req.body.role!=='recruiter'||!canAccess(req.user,req.body)))return res.status(403).json({error:'Managers may create recruiters only in their assigned scope'});
  }
  if(req.path.startsWith('/users/')&&req.method==='DELETE'&&req.user.role!=='super_admin')return res.status(403).json({error:'Super Admin access required'});
  if(req.path.startsWith('/clusters/')&&req.method==='DELETE'&&req.user.role!=='super_admin')return res.status(403).json({error:'Super Admin access required'});
  if(req.path.match(/^\/jobs\/[^/]+\/status$/)){
    const job=getJobs().find(j=>j.id===req.path.split('/')[2]);
    if(req.user.role!=='manager'||!job||!canAccess(req.user,job))return res.status(403).json({error:'Demand access required'});
  }
  if(req.body?.job && !canAccess(req.user,req.body.job))return res.status(403).json({error:'Job is outside your assigned scope'});
  if(req.body?.candidateId){const c=getCandidate(req.body.candidateId);const j=c&&getJobs().find(j=>j.id===c.jobId);if(!j||!canAccess(req.user,j))return res.status(403).json({error:'Candidate access denied'});}
  next();
});
app.use('/api/workflow',workflowRouter);
app.get('/api/auth/setup-status',(req,res)=>res.json({available:process.env.NODE_ENV!=='production'&&(!getUserByEmail(ADMIN_EMAIL)||getUserByEmail(ADMIN_EMAIL).password==='activation_pending'),email:ADMIN_EMAIL,name:'Praveen Ambrose'}));


// Health check endpoints
app.get("/healthz", (_req, res) => res.status(200).send("OK"));
app.get("/api/health", (_req, res) => {
  const hasPersistentMount = fs.existsSync("/app/data") || Boolean(process.env.DATA_DIR);
  const keyConfigured = Boolean(process.env.ANTHROPIC_API_KEY || getSetting("ANTHROPIC_API_KEY"));
  res.json({
    ok: true,
    keyConfigured,
    persistentStorage: hasPersistentMount ? "Active (/app/data)" : "Local Ephemeral (No volume mounted)",
    environment: process.env.NODE_ENV || "development"
  });
});

// System Settings Endpoints
app.get("/api/settings", (_req, res) => {
  try {
    const rawKey = getSetting("ANTHROPIC_API_KEY") || process.env.ANTHROPIC_API_KEY || "";
    const masked = rawKey ? `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}` : "";
    res.json({
      anthropicConfigured: Boolean(rawKey),
      maskedKey: masked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/settings", (req, res) => {
  try {
    const { anthropicKey } = req.body || {};
    if (anthropicKey && typeof anthropicKey === "string" && anthropicKey.trim()) {
      saveSetting("ANTHROPIC_API_KEY", anthropicKey.trim());
      process.env.ANTHROPIC_API_KEY = anthropicKey.trim();
      addLog("CONFIG", "Updated Anthropic API Key in persistent system settings");
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Version & System Info
app.get("/api/version", (_req, res) => {
  res.json({
    version: "1.3.0",
    name: "CogniHire AI Shortlisting & Recommendation Agent",
    releaseDate: "2026-09-30",
    gitBranch: "main",
    status: "healthy"
  });
});

// Fetch companies
app.get("/api/companies", (req, res) => {
  try {
    const companies = getCompanies();
    res.json(companies.filter(c=>req.user.role==='super_admin'||scopes(req.user).some(s=>s.customer_id===c.id)));
  } catch (err) {
    console.error("[get-companies] error:", err.message);
    res.status(500).json({ error: "Failed to read companies" });
  }
});

// Save companies
app.post("/api/save-companies", (req, res) => {
  try {
    const { companies } = req.body || {};
    if (!Array.isArray(companies)) {
      return res.status(400).json({ error: "Invalid payload: companies must be an array" });
    }
    saveCompanies(companies);
    addLog("COMPANY_UPDATE", `Updated client companies list (${companies.length} companies)`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[save-companies] error:", err.message);
    res.status(500).json({ error: err.message || "Failed to save companies" });
  }
});

// ── AUTHENTICATION ENDPOINTS ───────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body || {};
    const attemptKey=req.ip+'|'+String(email).toLowerCase();
    const attempt=loginAttempts.get(attemptKey);
    if(attempt && attempt.count>=10 && attempt.until>Date.now())return res.status(429).json({error:'Too many attempts. Try again in 15 minutes.'});
    const user = authenticateUser(email, password);
    if(!user){const count=attempt?.until>Date.now()?attempt.count:0;loginAttempts.set(attemptKey,{count:count+1,until:Date.now()+15*60000});}
    else loginAttempts.delete(attemptKey);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    addLog("AUTH", `User ${user.name} (${user.role}) logged in successfully`);
    createSession(res,user);
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/setup-admin", (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (typeof email!=='string' || typeof password!=='string' || !email || password.length<8) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if(email.trim().toLowerCase()!==ADMIN_EMAIL)return res.status(403).json({error:'Only Praveen Ambrose can activate the designated Super Admin account'});
    if(getUserByEmail(ADMIN_EMAIL)&&getUserByEmail(ADMIN_EMAIL).password!=='activation_pending')return res.status(409).json({error:'Super Admin is already configured. Use sign in.'});
    if(process.env.NODE_ENV==='production' || !['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))return res.status(403).json({error:'Initial setup is available only on localhost'});
    const adminUser = upsertSuperAdmin({
      name: "Praveen Ambrose",
      email: email.trim(),
      password: password.trim()
    });
    addLog("AUTH", `Super Admin ${adminUser.name} (${adminUser.email}) registered/updated successfully`);
    // Retire the known seeded demo credentials when the designated admin activates.
    for(const demoId of ['user_admin_motherson','user_manager_mech','user_recruiter_mech']){
      const demo=getUserById(demoId);
      if(demo && ['admin@motherson.com','manager.mech@bosch.com','recruiter.mech@bosch.com'].includes(demo.email)){
        database.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(randomBytes(32).toString('hex')),demoId);
        database.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(demoId);
      }
    }
    createSession(res,adminUser);
    res.json({ ok: true, user: adminUser });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to setup super admin" });
  }
});

app.get("/api/auth/me", (req, res) => {
  try {
    const user=req.user;
    if(!user)return res.status(401).json({error:'Session expired. Please sign in.'});
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/logout", (req, res) => {
  endSession(req,res);
  res.json({ ok: true });
});

// ── CLUSTER MANAGEMENT ENDPOINTS ───────────────────────────────────
app.get("/api/clusters", (req, res) => {
  try {
    const { customerId } = req.query || {};
    const clusters = getClusters(customerId);
    res.json(clusters.filter(c=>req.user.role==='super_admin'||scopes(req.user).some(s=>s.cluster_id===c.id)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/clusters", (req, res) => {
  try {
    const { customerId, name, description } = req.body || {};
    if (!customerId || !name || !name.trim()) {
      return res.status(400).json({ error: "Missing customerId or cluster name" });
    }
    const cluster = createCluster({ customerId, name: name.trim(), description });
    addLog("CLUSTER_CREATE", `Created cluster "${name}" for customer ${customerId}`);
    res.json({ ok: true, cluster });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/clusters/:id", (req, res) => {
  try {
    const { id } = req.params;
    if(records('demand').some(d=>d.clusterId===id)||records('application').some(a=>a.clusterId===id))return res.status(409).json({error:'Cluster has workflow records. Reassign them before deleting.'});
    deleteCluster(id);
    addLog("CLUSTER_DELETE", `Deleted cluster ${id}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

database.exec('CREATE TABLE IF NOT EXISTS account_email_delivery(user_id TEXT PRIMARY KEY,status TEXT NOT NULL,attempted_at TEXT NOT NULL,message_id TEXT,error_code TEXT)');
function recordAccountEmail(userId,result){database.prepare('INSERT INTO account_email_delivery VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET status=excluded.status,attempted_at=excluded.attempted_at,message_id=excluded.message_id,error_code=excluded.error_code').run(userId,result.status,new Date().toISOString(),result.messageId||null,result.code||null);syncToPersistentStorage(true);}
app.get('/api/mail/status',(req,res)=>{if(!['super_admin','manager'].includes(req.user.role))return res.status(403).json({error:'Staff provisioning access required'});const c=publicMailSettings();res.json({configured:c.configured,fromEmail:c.fromEmail,loginUrl:c.loginUrl,reason:c.reason});});
app.get('/api/mail/settings',(req,res)=>res.json(publicMailSettings()));
app.post('/api/mail/settings',(req,res)=>{try{res.json(saveAccountMailSettings(req.body||{}));}catch(e){res.status(400).json({error:e.message});}});
app.post('/api/mail/verify',async(req,res)=>{try{const result=await verifyAccountMail();res.status(result.ok?200:400).json(result);}catch{res.status(400).json({error:'Unable to verify email configuration'});}});
app.post('/api/users/:id/welcome-email',async(req,res)=>{
 try{const user=getUserById(req.params.id);if(!user||!['manager','recruiter'].includes(user.role))return res.status(404).json({error:'Manager or recruiter account not found'});
 if(req.user.role!=='super_admin'&&!(req.user.role==='manager'&&user.role==='recruiter'&&canAccess(req.user,user)))return res.status(403).json({error:'Account access denied'});
 const config=publicMailSettings();if(!config.configured)return res.status(400).json({error:config.reason});
 const password=req.body?.password;if(typeof password!=='string'||password.length<8)return res.status(400).json({error:'Enter a new initial password with at least 8 characters'});
 database.prepare('UPDATE users SET password=? WHERE id=?').run(hashPassword(password),user.id);database.prepare('DELETE FROM auth_sessions WHERE user_id=?').run(user.id);
 const emailDelivery=await sendWelcomeEmail(user,password);emailDelivery.message=emailDelivery.message.replace(/^Account created\./,'Password reset.');recordAccountEmail(user.id,emailDelivery);addLog('CREDENTIAL_RESET',`Password reset for staff user ${user.id}; welcome email ${emailDelivery.status}`);res.json({ok:true,emailDelivery});
 }catch{res.status(500).json({error:'Unable to reset the password and send the welcome email'});}
});

// ── USER MANAGEMENT ENDPOINTS ──────────────────────────────────────
app.get("/api/users", (req, res) => {
  try {
    const { role, customerId, clusterId } = req.query || {};
    const users = getUsers({ role, customerId, clusterId });
    res.json(users.map(u=>({...u,assignments:scopes(u).map(s=>({customerId:s.customer_id,clusterId:s.cluster_id}))})).filter(u=>req.user.role==='super_admin'||u.id===req.user.id||u.assignments.some(a=>canAccess(req.user,a))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password, role, customerId, clusterId, createdBy } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }
    if(typeof password!=='string'||password.length<8)return res.status(400).json({error:'Password must contain at least 8 characters'});
    if(clusterId&&!getClusters(customerId).some(c=>c.id===clusterId))return res.status(400).json({error:'Choose a cluster belonging to this customer'});
    if(!validRecipient(email?.trim())||typeof name!=='string'||!name.trim()||name.length>200||/[\r\n]/.test(name))return res.status(400).json({error:'Enter a valid name and one email address'});
    const existing = getUserByEmail(email.trim());
    if (existing) {
      return res.status(400).json({ error: "A user with this email address already exists" });
    }
    const user = createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      customerId: customerId || null,
      clusterId: clusterId || null,
      createdBy: createdBy || null
    });
    if(user.customerId&&user.clusterId)database.prepare('INSERT OR IGNORE INTO workflow_assignments VALUES(?,?,?)').run(user.id,user.customerId,user.clusterId);
    addLog("USER_CREATE", `Created ${role} account for ${name} (${email})`);
    const emailDelivery=await sendWelcomeEmail(user,password);
    recordAccountEmail(user.id,emailDelivery);
    res.json({ ok: true, user, emailDelivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    deleteUser(id);
    addLog("USER_DELETE", `Deleted user account ${id}`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── JOB STATUS & LIFECYCLE ENDPOINT ────────────────────────────────
app.post("/api/jobs/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!["draft", "posted", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be draft, posted, or closed." });
    }
    const jobs = getJobs();
    const targetJob = jobs.find(j => j.id === id);
    if (!targetJob) {
      return res.status(404).json({ error: "Job opening not found" });
    }
    if(status==='posted'&&(!targetJob.title?.trim()||!targetJob.description?.trim()))return res.status(400).json({error:'A job title and description are required before posting'});
    targetJob.status = status;
    if (status === "posted" && !targetJob.postedAt) targetJob.postedAt = new Date().toISOString();
    if (status === "closed") targetJob.closedAt = new Date().toISOString();
    if (status === "posted") targetJob.closedAt = null;
    saveJobs(jobs);
    synchronizeScreeningWorkflow(req.user);
    addLog("JOB_STATUS", `Job "${targetJob.title}" status changed to ${status.toUpperCase()}`, targetJob.companyName);
    res.json({ ok: true, job: {...targetJob,jobReference:jobReference(id)},postedAt:targetJob.postedAt,closedAt:targetJob.closedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch activity logs
app.get("/api/logs", (_req, res) => {
  try {
    const logs = getLogs();
    res.json(logs);
  } catch (err) {
    console.error("[get-logs] error:", err.message);
    res.status(500).json({ error: "Failed to read activity logs" });
  }
});

// Add activity log manually
app.post("/api/log", (req, res) => {
  try {
    const { type, message, companyName, details } = req.body || {};
    addLog(type || "INFO", message || "", companyName || "", details || "");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Screen one resume against one job
app.post("/api/analyze", async (req, res) => {
  const { job, resume, provider, apiKey } = req.body || {};
  try {
    if (!job || !job.title || !job.description) {
      return res.status(400).json({ error: "Missing or incomplete job definition" });
    }
    if (!resume) {
      return res.status(400).json({ error: "Missing resume payload" });
    }

    let finalResume = resume;
    if (resume.type === "db") {
      const cand = getCandidate(resume.candidateId);
      if (!cand) {
        return res.status(404).json({ error: "Candidate not found in database" });
      }
      if (cand.kind === "file") {
        if (cand.base64) {
          finalResume = { type: "file", filename: cand.filename, base64: cand.base64 };
        } else if (cand.text) {
          finalResume = { type: "text", text: cand.text };
        } else {
          return res.status(400).json({ error: `Resume content for ${cand.label || 'candidate'} is missing` });
        }
      } else {
        finalResume = { type: "text", text: cand.text || "" };
      }
    }

    const candidateId=resume.candidateId;
    if(candidateId){const candidate=getCandidate(candidateId);const savedJob=candidate&&getJobs().find(j=>j.id===candidate.jobId);if(!savedJob||savedJob.id!==job.id||!canAccess(req.user,savedJob))return res.status(403).json({error:'Candidate does not belong to this job or assigned scope'});}
    const result = await analyzeResume(job, finalResume, provider, apiKey);
    if(candidateId){database.prepare('UPDATE candidates SET result=?,status=?,error=NULL WHERE id=?').run(JSON.stringify(result),'done',candidateId);synchronizeScreeningWorkflow(req.user);}
    addLog("SCREENING", `Screened resume for candidate ${result.candidateName || 'Candidate'} (${result.recommendation || 'Score: ' + result.overallScore})`, job.companyName || "", `Job: ${job.title} | Score: ${result.overallScore}`);
    res.json(result);
  } catch (err) {
    console.error("[analyze] error:", err.message);
    addLog("ERROR", `Screening failed: ${err.message}`, job?.companyName || "", `Job: ${job?.title || "Unknown"}`);
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

// Send AI Interview Invitation Link via Email Endpoint
app.post("/api/send-interview-email", (req, res) => {
  try {
    const { candidateName, email, phone, jobTitle, companyName, interviewLink, senderEmail, senderName, replyTo } = req.body || {};
    const effectiveReplyTo = replyTo || senderEmail || "N/A";
    const effectiveSender = senderName || "Hiring Team";
    addLog(
      "INTERVIEW_INVITE",
      `Prepared AI Interview Invitation for ${candidateName || 'Candidate'} (${email || 'N/A'})`,
      companyName || "",
      `From: "${effectiveSender} via CogniHire" | Reply-To: ${effectiveReplyTo} | Role: ${jobTitle || 'Opening'} | Link: ${interviewLink || 'N/A'}`
    );
    res.json({ ok: true, delivery:"manual",draftedFor: email, senderName: effectiveSender, replyTo: effectiveReplyTo, interviewLink });
  } catch (err) {
    console.error("[send-interview-email] error:", err.message);
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

// Conversational AI Interviewer Chat Endpoint
app.post("/api/interview/chat", async (req, res) => {
  try {
    const { job, candidate, history, provider, apiKey } = req.body || {};
    if (!job || !candidate || !Array.isArray(history)) {
      return res.status(400).json({ error: "Missing job, candidate, or history in payload" });
    }
    const question = await getNextInterviewQuestion(job, candidate, history, provider, apiKey);
    res.json({ question });
  } catch (err) {
    console.error("[interview-chat] error:", err.message);
    res.status(500).json({ error: err.message || "Chat failed" });
  }
});

// ── VIDEO INTERVIEW ENDPOINTS ──────────────────────────────────────

// Generate personalised interview questions dynamically via active LLM Provider
app.post("/api/interview/video-questions", async (req, res) => {
  try {
    const { job, candidate, provider, apiKey } = req.body || {};
    const questions = await generateInterviewQuestions(job, candidate, provider, apiKey);
    
    if (Array.isArray(questions) && questions.length > 0) {
      addLog("INTERVIEW", `Generated ${questions.length} interview questions for ${candidate?.name || 'Candidate'} using ${provider || 'claude'}`, "", `Role: ${job?.title}`);
      return res.json({ questions });
    }

    // Fallback questions if parsing completely fails
    const fallback = [
      `Hello ${candidate?.name || "Candidate"}! Could you briefly introduce yourself and explain why you're interested in the ${job?.title} role?`,
      `Describe a challenging technical project you led recently. What was your approach and what was the outcome?`,
      `The role requires ${(job?.mustHave || ["strong technical skills"]).join(", ")}. Can you give a specific example of how you've applied these?`,
      `How do you stay updated with the latest developments in your field? What resources or communities do you follow?`,
      `Tell us about a time you had to work under pressure or with limited resources. How did you manage it?`
    ];
    res.json({ questions: fallback });
  } catch (err) {
    console.error("[interview/video-questions] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// Evaluate interview transcript dynamically via active LLM Provider
app.post("/api/interview/video-evaluate", async (req, res) => {
  const assessedCandidateId=req.interviewCandidateId||req.body.candidate?.id||req.body.candidateId;
  if(assessedCandidateId){
    if(!Array.isArray(req.body.transcript))return res.status(400).json({error:'Transcript is required'});
    const originalJson=res.json.bind(res);
    res.json=value=>{
      if(res.statusCode<400&&Number.isFinite(value?.technicalScore)){
        for(const [id,v] of interviewAssessments)if(v.expires<Date.now())interviewAssessments.delete(id);
        if(interviewAssessments.size>=1000)interviewAssessments.delete(interviewAssessments.keys().next().value);
        interviewAssessments.set(assessedCandidateId,{score:value.technicalScore,summary:value.summary,transcript:transcriptDigest(req.body.transcript),expires:Date.now()+30*60000});
      }
      return originalJson(value);
    };
  }
  try {
    const { job, candidate, transcript, malpractice, provider, apiKey } = req.body || {};
    
    const evaluation = await evaluateVideoInterviewTranscript(job, candidate, transcript, malpractice, provider, apiKey);
    
    if (evaluation && typeof evaluation.technicalScore === "number") {
      addLog("INTERVIEW", `Evaluated ${candidate?.name || 'Candidate'} using ${provider || 'claude'} — ${evaluation.overallGrade || 'N/A'} (Tech: ${evaluation.technicalScore}%, Comm: ${evaluation.communicationScore}%, Integrity: ${evaluation.integrityScore}%)`, "", `Recommendation: ${evaluation.recommendation || 'N/A'}`);
      return res.json(evaluation);
    }

    return res.status(503).json({error:'Interview evaluation is unavailable. Retry or request manual review.'});
  } catch (err) {
    console.error("[interview/video-evaluate] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Save proctoring report to candidate record
app.post("/api/save-proctoring", (req, res) => {
  try {
    const { candidateId, malpractice, malpracticeLog, transcript, report } = req.body || {};
    const totalViolations = Object.values(malpractice || {}).reduce((a, b) => a + b, 0);
    addLog(
      "PROCTORING",
      `Proctoring report saved for candidate ${candidateId || "Unknown"} — ${totalViolations} violation(s), Integrity: ${Math.max(30, 100 - totalViolations * 7)}%`,
      "",
      `Tech: ${report?.technicalScore}% | Comm: ${report?.communicationScore}%`
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Candidate Comparative Analysis Endpoint
app.post("/api/candidate-compare", async (req, res) => {
  try {
    const { job, candidates, provider, apiKey } = req.body || {};
    if (!candidates || candidates.length < 2) {
      return res.status(400).json({ error: "At least 2 candidates are required for comparison." });
    }
    const comparison = await compareCandidatesWithClaude(job, candidates, provider, apiKey);
    addLog(
      "COMPARISON",
      `Generated comparative analysis between ${candidates.length} candidates for ${job?.title || 'Job Opening'}`,
      "",
      `Verdict: ${comparison?.headline || 'Analysis complete'}`
    );
    res.json(comparison);
  } catch (err) {
    console.error("[candidate-compare] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Conversational AI Interviewer Evaluation Endpoint
app.post("/api/interview/evaluate", async (req, res) => {
  try {
    const { job, candidate, history, proctoring, provider, apiKey } = req.body || {};
    if (!job || !candidate || !Array.isArray(history)) {
      return res.status(400).json({ error: "Missing job, candidate, or history in payload" });
    }
    const evaluation = await evaluateInterview(job, candidate, history, proctoring, provider, apiKey);
    if(!Number.isFinite(evaluation?.score)||evaluation.score<0||evaluation.score>100)return res.status(503).json({error:'AI interview evaluation is unavailable. Retry or request manual review.'});
    if(candidate.id&&Number.isFinite(evaluation.score)){saveCandidateInterview(candidate.id,{score:evaluation.score,summary:evaluation.summary||evaluation.feedback||'',transcript:history,completedAt:new Date().toISOString()});synchronizeScreeningWorkflow(req.user);}
    addLog("INTERVIEW", `Completed AI interview for ${candidate.result?.candidateName || candidate.label}`, job.companyName || "", `Score: ${evaluation.score}/100`);
    res.json(evaluation);
  } catch (err) {
    console.error("[interview-evaluate] error:", err.message);
    res.status(500).json({ error: err.message || "Evaluation failed" });
  }
});

// Secure Candidate Info Endpoint
app.get("/api/candidate-interview-info", (req, res) => {
  try {
    const { candidateId } = req.query || {};
    if (!candidateId) {
      return res.status(400).json({ error: "Missing candidateId query parameter" });
    }
    const cand = getCandidate(candidateId);
    if (!cand) {
      return res.status(404).json({ error: "Candidate session not found" });
    }
    
    const jobs = getJobs();
    const job = jobs.find(j => j.id === cand.jobId);
    if(req.user && (!job || !canAccess(req.user,job)))return res.status(403).json({error:'Candidate access denied'});
    
    res.json({
      candidateName: cand.result?.candidateName || cand.label,
      jobTitle: job ? job.title : "Untitled Role",
      companyName: job ? (job.companyName || "Client Company") : "Client Company",
      skills: cand.result?.topSkills || []
    });
  } catch (err) {
    console.error("[candidate-interview-info] error:", err.message);
    res.status(500).json({ error: "Failed to retrieve candidate information" });
  }
});

// Secure Candidate Assessment Submission Endpoint
app.post("/api/candidate-interview-submit", (req, res) => {
  try {
    const { candidateId, score, summary, transcript, proctoring } = req.body || {};
    if (!candidateId || score === undefined || !Array.isArray(transcript)) {
      return res.status(400).json({ error: "Missing candidateId, score, or transcript in payload" });
    }
    
    let trustedScore=score,trustedSummary=summary;
    {
      const assessment=interviewAssessments.get(candidateId);
      if(!assessment||assessment.expires<Date.now()||assessment.transcript!==transcriptDigest(transcript))return res.status(409).json({error:'Complete server evaluation before submitting this transcript'});
      trustedScore=assessment.score;trustedSummary=assessment.summary;
    }
    if(!Number.isFinite(trustedScore)||trustedScore<0||trustedScore>100)return res.status(400).json({error:'Invalid interview score'});
    saveCandidateInterview(candidateId, {score:trustedScore,summary:trustedSummary,transcript,proctoring,completedAt:new Date().toISOString()});
    synchronizeScreeningWorkflow(req.user||{id:'candidate_interview',name:'Candidate interview',role:'super_admin'});
    interviewAssessments.delete(candidateId);
    addLog("REMOTE_INTERVIEW", `Remote candidate assessment submitted (${score}/100)`);
    res.json({ ok: true });
  } catch (err) {
    console.error("[candidate-interview-submit] error:", err.message);
    res.status(500).json({ error: err.message || "Failed to submit assessment results" });
  }
});

// Fetch all jobs and candidates from SQLite
app.get("/api/jobs", (req, res) => {
  try {
    const jobs = getJobs();
    if(req.interviewCandidateId){
      const j=jobs.find(j=>j.candidates.some(c=>c.id===req.interviewCandidateId));
      return res.json(j?[{id:j.id,title:j.title,companyName:j.companyName,description:j.description,mustHave:j.mustHave,candidates:j.candidates.filter(c=>c.id===req.interviewCandidateId).map(c=>({id:c.id,label:c.label,result:{candidateName:c.result?.candidateName,topSkills:c.result?.topSkills,interviewQuestions:c.result?.interviewQuestions}}))}]:[]);
    }
    res.json(jobs.filter(j=>canAccess(req.user,j)&&(req.user.role!=='recruiter'||j.status!=='draft')).map(j=>({...j,jobReference:jobReference(j.id),candidates:j.candidates.map(c=>({...c,interviewToken:req.user.role==='recruiter'?interviewToken(c.id):undefined}))})));
  } catch (err) {
    console.error("[get-jobs] error:", err.message);
    res.status(500).json({ error: "Failed to read database records" });
  }
});

// Save all jobs and candidates to SQLite
app.post("/api/save-jobs", (req, res) => {
  try {
    const { jobs } = req.body || {};
    if (!Array.isArray(jobs)) {
      return res.status(400).json({ error: "Invalid payload: jobs must be an array" });
    }
    const existing=getJobs();
    if(jobs.some(j=>!canAccess(req.user,j)||existing.some(old=>old.id===j.id&&!canAccess(req.user,old))))return res.status(403).json({error:'Job is outside your assigned scope'});
    validateJobBatch(req.user,jobs,existing,{canAccess,getClusters,getCompanies});
    const candidateOwners=new Map(existing.flatMap(j=>(j.candidates||[]).map(c=>[c.id,j.id])));
    const candidateIds=new Set();
    for(const j of jobs)for(const c of j.candidates||[]){
      if(candidateIds.has(c.id)||(candidateOwners.has(c.id)&&candidateOwners.get(c.id)!==j.id))return res.status(409).json({error:'Candidate IDs must be unique and cannot move between jobs'});
      candidateIds.add(c.id);
    }
    const linkedJobIds=new Set(records('demand').map(d=>d.jobId).filter(Boolean));
    saveJobs([...existing.filter(j=>!jobs.some(x=>x.id===j.id)),...jobs]);
    const trackerSync=synchronizeScreeningWorkflow(req.user);
    res.json({ok:true,trackerSync,jobReferences:Object.fromEntries(jobs.map(j=>[j.id,jobReference(j.id)])),interviewTokens:Object.fromEntries(req.user.role==='recruiter'?jobs.flatMap(j=>(j.candidates||[]).map(c=>[c.id,interviewToken(c.id)])):[])});
  } catch (err) {
    console.error("[save-jobs] error:", err.message);
    res.status(err.status||500).json({ error: err.message || "Failed to save records" });
  }
});

// Serve the built frontend in production
const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const server = app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`\n  CogniHire AI Interviewer & Assessment Portal listening on http://0.0.0.0:${PORT}`);
  if (process.env.LLM_PROVIDER === "ollama") {
    console.log(`  LLM Provider: Local Ollama (${process.env.MODEL || "llama3.1"})`);
  } else {
    console.log(`  LLM Provider: Anthropic Claude`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("  WARNING: ANTHROPIC_API_KEY is not set in environment (make sure it's set in the frontend settings!).");
    }
  }
  console.log("");
});

server.on("error", (err) => {
  console.error("[CRITICAL] HTTP server failed to start:", err);
});



