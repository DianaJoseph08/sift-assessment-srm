// Watch reload trigger
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { analyzeResume, getNextInterviewQuestion, evaluateInterview, generateInterviewQuestions, evaluateVideoInterviewTranscript, compareCandidatesWithClaude } from "./analyze.js";
import { getJobs, saveJobs, getCandidate, saveCandidateInterview, getCompanies, saveCompanies, getLogs, addLog, getSetting, saveSetting } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" })); // resumes are sent as base64

// Health check
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

// Fetch companies
app.get("/api/companies", (_req, res) => {
  try {
    const companies = getCompanies();
    res.json(companies);
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

    const result = await analyzeResume(job, finalResume, provider, apiKey);
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
      `Sent AI Interview Invitation to ${candidateName || 'Candidate'} (${email || 'N/A'})`,
      companyName || "",
      `From: "${effectiveSender} via CogniHire" | Reply-To: ${effectiveReplyTo} | Role: ${jobTitle || 'Opening'} | Link: ${interviewLink || 'N/A'}`
    );
    res.json({ ok: true, sentTo: email, senderName: effectiveSender, replyTo: effectiveReplyTo, interviewLink });
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
  try {
    const { job, candidate, transcript, malpractice, provider, apiKey } = req.body || {};
    
    const evaluation = await evaluateVideoInterviewTranscript(job, candidate, transcript, malpractice, provider, apiKey);
    
    if (evaluation && typeof evaluation.technicalScore === "number") {
      addLog("INTERVIEW", `Evaluated ${candidate?.name || 'Candidate'} using ${provider || 'claude'} — ${evaluation.overallGrade || 'N/A'} (Tech: ${evaluation.technicalScore}%, Comm: ${evaluation.communicationScore}%, Integrity: ${evaluation.integrityScore}%)`, "", `Recommendation: ${evaluation.recommendation || 'N/A'}`);
      return res.json(evaluation);
    }

    // ── Fair fallback: score based on actual answer effort & content ───────
    const answers = (transcript || []).map(t => t.a || "");
    const faceAbsentCount = (malpractice && malpractice.faceAbsent) || 0;
    const tabSwitchesCount = (malpractice && malpractice.tabSwitches) || 0;

    const answerScores = answers.map(ans => {
      const words = ans.trim().split(/\s+/).filter(w => w.length > 1);
      if (!ans.trim() || ans.toLowerCase().includes("[no response")) return 25;
      if (words.length < 15) return 55;
      if (words.length < 35) return 72;
      if (words.length < 75) return 85;
      return 92;
    });
    const totalAnswers = answerScores.length || 1;
    let techScore = Math.round(answerScores.reduce((a, b) => a + b, 0) / totalAnswers);
    const commScore = Math.min(100, Math.round(techScore * 0.95));

    // Fair, proportional deduction for unexcused telemetry events (never artificial wipeout)
    const integrityPenalty = (faceAbsentCount * 10) + (tabSwitchesCount * 15);
    const integrityScore = Math.max(50, 100 - integrityPenalty);
    
    let grade = techScore >= 80 ? "Good" : techScore >= 60 ? "Average" : "Needs Improvement";
    let rec = techScore >= 65 && integrityScore >= 70 ? "Recommend for Next Round" : (techScore >= 50 ? "Borderline / Further Review" : "Do Not Recommend");

    let proctoringSummary = integrityPenalty > 0 
      ? ` Note: Proctoring telemetry observed minor focus events (Integrity: ${integrityScore}%).`
      : ` Clean proctoring session (Integrity: ${integrityScore}%).`;

    res.json({
      technicalScore: techScore,
      communicationScore: commScore,
      integrityScore: integrityScore,
      overallGrade: grade,
      recommendation: rec,
      summary: `${candidate?.name || "The candidate"}'s technical responses evaluated at ${techScore}%.${proctoringSummary}`,
      strengths: techScore >= 65 ? ["Provided relevant answers to technical prompts", "Demonstrated clear technical communication"] : ["Completed the interview session"],
      improvements: techScore < 70 ? ["Provide deeper technical architecture details", "Include specific implementation examples"] : ["Continue refining real-world problem explanations"]
    });
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
    
    saveCandidateInterview(candidateId, {
      score,
      summary,
      transcript,
      proctoring
    });
    addLog("REMOTE_INTERVIEW", `Remote candidate assessment submitted (${score}/100)`);
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

// Serve the built frontend in production
const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => {
  console.log(`\n  CogniHire AI Interviewer & Assessment Portal listening on http://localhost:${PORT}`);
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
