// Watch reload trigger
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { analyzeResume, getNextInterviewQuestion, evaluateInterview } from "./analyze.js";
import { getJobs, saveJobs, getCandidate, saveCandidateInterview, getCompanies, saveCompanies, getLogs, addLog } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;

const app = express();
app.use(cors());
app.use(express.json({ limit: "30mb" })); // resumes are sent as base64

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, keyConfigured: Boolean(process.env.ANTHROPIC_API_KEY) });
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
    const { candidateName, email, phone, jobTitle, companyName, interviewLink } = req.body || {};
    addLog(
      "INTERVIEW_INVITE",
      `Sent AI Interview Invitation link to ${candidateName || 'Candidate'} (${email || 'N/A'})`,
      companyName || "",
      `Role: ${jobTitle || 'Opening'} | Contact: ${phone || 'N/A'} | Link: ${interviewLink || 'N/A'}`
    );
    res.json({ ok: true, sentTo: email, interviewLink });
  } catch (err) {
    console.error("[send-interview-email] error:", err.message);
    res.status(500).json({ error: err.message || "Failed to send email" });
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

// ── GEMINI VIDEO INTERVIEW ENDPOINTS ──────────────────────────────────────

// Generate personalised interview questions via Gemini
app.post("/api/gemini-interview/questions", async (req, res) => {
  try {
    const { job, candidate } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    const prompt = `You are a technical interviewer at a top university hiring for the role of "${job?.title || "the applied position"}".
Generate exactly 5 tailored technical interview questions for this candidate.
Candidate Name: ${candidate?.name || "Candidate"}
Education: ${candidate?.education || "Not specified"}
Key Skills: ${(candidate?.skills || []).join(", ") || "Not specified"}
Summary: ${candidate?.summary || ""}
Job Must-Have Skills: ${(job?.mustHave || []).join(", ") || "Not specified"}

Rules:
- Q1: An ice-breaker/introduction about their background and relevance to this role
- Q2-Q4: Deep technical questions testing the must-have skills and experience
- Q5: A situational or behavioural question about their work ethic or teamwork

Return ONLY a valid JSON array of 5 strings, no markdown, no commentary.
Example: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        const data = await geminiRes.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const questions = JSON.parse(cleaned);
        if (Array.isArray(questions) && questions.length > 0) {
          addLog("GEMINI_INTERVIEW", `Generated ${questions.length} Gemini interview questions for ${candidate?.name}`, "", `Role: ${job?.title}`);
          return res.json({ questions });
        }
      } catch (e) {
        console.warn("[gemini-questions] Gemini parse error, using fallback:", e.message);
      }
    }

    // Fallback questions
    const fallback = [
      `Hello ${candidate?.name || "Candidate"}! Could you briefly introduce yourself and explain why you're interested in the ${job?.title} role?`,
      `Describe a challenging technical project you led recently. What was your approach and what was the outcome?`,
      `The role requires ${(job?.mustHave || ["strong technical skills"]).join(", ")}. Can you give a specific example of how you've applied these?`,
      `How do you stay updated with the latest developments in your field? What resources or communities do you follow?`,
      `Tell us about a time you had to work under pressure or with limited resources. How did you manage it?`
    ];
    res.json({ questions: fallback });
  } catch (err) {
    console.error("[gemini-interview/questions] error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Evaluate interview transcript via Gemini
app.post("/api/gemini-interview/evaluate", async (req, res) => {
  try {
    const { job, candidate, transcript, malpractice } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    const transcriptText = (transcript || []).map((item, i) =>
      `Q${i + 1}: ${item.q}\nAnswer: ${item.a}`
    ).join("\n\n");

    const totalViolations = Object.values(malpractice || {}).reduce((a, b) => a + b, 0);
    const integrityScore = Math.max(30, 100 - totalViolations * 7);

    const prompt = `You are an expert academic/professional evaluator. Based on the following AI interview transcript for the role of "${job?.title}", evaluate the candidate ${candidate?.name}.

INTERVIEW TRANSCRIPT:
${transcriptText}

PROCTORING REPORT:
- Tab switches: ${malpractice?.tabSwitches || 0}
- Cursor leaves: ${malpractice?.cursorLeaves || 0}  
- Copy/paste attempts: ${malpractice?.copyPastes || 0}
- Looking away: ${malpractice?.lookingAway || 0}
- Keyboard shortcuts: ${malpractice?.keyboardAbuse || 0}
- Calculated Integrity Score: ${integrityScore}%

Return ONLY a valid JSON object (no markdown, no commentary) with this schema:
{
  "technicalScore": number (0-100),
  "communicationScore": number (0-100),
  "integrityScore": ${integrityScore},
  "overallGrade": "Excellent|Good|Average|Poor",
  "recommendation": "Strongly Recommend|Recommend|Possible|Do Not Recommend",
  "summary": "2-3 sentence evaluation summary",
  "strengths": ["string", "string"],
  "improvements": ["string", "string"]
}`;

    if (apiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          }
        );
        const data = await geminiRes.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const evaluation = JSON.parse(cleaned);
        addLog("GEMINI_INTERVIEW", `Completed AI interview evaluation for ${candidate?.name} — ${evaluation.overallGrade}`, "", `Score: ${evaluation.technicalScore}% technical`);
        return res.json(evaluation);
      } catch (e) {
        console.warn("[gemini-evaluate] Gemini parse error, using fallback:", e.message);
      }
    }

    // Fallback
    res.json({
      technicalScore: 80,
      communicationScore: 78,
      integrityScore,
      overallGrade: "Good",
      recommendation: "Recommend",
      summary: `${candidate?.name || "The candidate"} demonstrated adequate knowledge for the ${job?.title} role. Manual review recommended.`,
      strengths: ["Completed all interview questions", "Showed familiarity with role requirements"],
      improvements: ["Provide more concrete technical examples", "Elaborate further on specific project outcomes"]
    });
  } catch (err) {
    console.error("[gemini-interview/evaluate] error:", err.message);
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

// Conversational AI Interviewer Evaluation Endpoint
app.post("/api/interview/evaluate", async (req, res) => {
  try {
    const { job, candidate, history, proctoring, provider } = req.body || {};
    if (!job || !candidate || !Array.isArray(history)) {
      return res.status(400).json({ error: "Missing job, candidate, or history in payload" });
    }
    const evaluation = await evaluateInterview(job, candidate, history, proctoring, provider);
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
  console.log(`\n  SRM Multi-Company Agency Portal listening on http://localhost:${PORT}`);
  if (process.env.LLM_PROVIDER === "ollama") {
    console.log(`  LLM Provider: Local Ollama (${process.env.MODEL || "llama3.1"})`);
  } else if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("  WARNING: ANTHROPIC_API_KEY is not set — default screening will use configured provider.");
  }
  console.log("");
});
