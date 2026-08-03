// Watch reload trigger
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { analyzeResume, getNextInterviewQuestion, evaluateInterview } from "./analyze.js";
import { getJobs, saveJobs, getCandidate, saveCandidateInterview } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" })); // resumes are sent as base64

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, keyConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

// Screen one resume against one job
app.post("/api/analyze", async (req, res) => {
  try {
    const { job, resume, provider } = req.body || {};
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
        if (!cand.base64) {
          return res.status(400).json({ error: "Resume file content is missing in database" });
        }
        finalResume = { type: "file", filename: cand.filename, base64: cand.base64 };
      } else {
        finalResume = { type: "text", text: cand.text || "" };
      }
    }

    const result = await analyzeResume(job, finalResume, provider);
    res.json(result);
  } catch (err) {
    console.error("[analyze] error:", err.message);
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

// Conversational AI Interviewer Chat Endpoint
app.post("/api/interview/chat", async (req, res) => {
  try {
    const { job, candidate, history, provider } = req.body || {};
    if (!job || !candidate || !Array.isArray(history)) {
      return res.status(400).json({ error: "Missing job, candidate, or history in payload" });
    }
    const question = await getNextInterviewQuestion(job, candidate, history, provider);
    res.json({ question });
  } catch (err) {
    console.error("[interview-chat] error:", err.message);
    res.status(500).json({ error: err.message || "Chat failed" });
  }
});

// Conversational AI Interviewer Evaluation Endpoint
app.post("/api/interview/evaluate", async (req, res) => {
  try {
    const { job, candidate, history, proctoring, provider } = req.body || {};
    if (!job || !candidate || !Array.isArray(history)) {
      return res.status(400).json({ error: "Missing job, candidate, or history in payload" });
    }
    const evaluation = await evaluateInterview(job, candidate, history, proctoring, provider);
    res.json(evaluation);
  } catch (err) {
    console.error("[interview-evaluate] error:", err.message);
    res.status(500).json({ error: err.message || "Evaluation failed" });
  }
});

// Secure Candidate Info Endpoint (only returns candidate name, job title, and skills)
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
    
    // Fetch job details securely
    const jobs = getJobs();
    const job = jobs.find(j => j.id === cand.jobId);
    
    res.json({
      candidateName: cand.result?.candidateName || cand.label,
      jobTitle: job ? job.title : "Untitled Role",
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
    
    saveCandidateInterview(candidateId, {
      score,
      summary,
      transcript,
      proctoring
    });
    res.json({ ok: true });
  } catch (err) {
    console.error("[candidate-interview-submit] error:", err.message);
    res.status(500).json({ error: err.message || "Failed to submit assessment results" });
  }
});

// Fetch all jobs and candidates from SQLite
app.get("/api/jobs", (_req, res) => {
  try {
    const jobs = getJobs();
    res.json(jobs);
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
    saveJobs(jobs);
    res.json({ ok: true });
  } catch (err) {
    console.error("[save-jobs] error:", err.message);
    res.status(500).json({ error: err.message || "Failed to save records" });
  }
});

// Serve the built frontend in production (npm run build then npm start)
const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`\n  SRM backend listening on http://localhost:${PORT}`);
  if (process.env.LLM_PROVIDER === "ollama") {
    console.log(`  LLM Provider: Local Ollama (${process.env.MODEL || "llama3.1"})`);
  } else if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("  WARNING: ANTHROPIC_API_KEY is not set — screening will fail unless LLM_PROVIDER=ollama.");
  }
  console.log("");
});
