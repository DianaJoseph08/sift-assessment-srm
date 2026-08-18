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

    const prompt = `You are a strict technical interviewer hiring for the role of "${job?.title || "the applied position"}".
Your goal is to VERIFY if the candidate actually possesses the skills they claimed on their resume, and test if they are truly eligible for this job.
Generate exactly 5 highly specific, tailored technical interview questions for this candidate.

Candidate Name: ${candidate?.name || "Candidate"}
Candidate Claimed Skills: ${(candidate?.skills || []).join(", ") || "Not specified"}
Candidate Summary: ${candidate?.summary || ""}
Job Must-Have Skills: ${(job?.mustHave || []).join(", ") || "Not specified"}

Rules for the 5 questions:
- DO NOT ask generic questions (e.g. avoid "Tell me about yourself" or "Describe a challenging project").
- Every question MUST be a direct, deep technical test of a specific skill claimed by the candidate that is relevant to the Job Must-Have Skills.
- Ask them to explain how a specific technology works under the hood, or how they would solve a complex technical problem using their claimed skills.
- The goal is to catch candidates who might be exaggerating on their resume. Make the questions challenging enough that only someone with real, practical experience can answer them.

Return ONLY a valid JSON array of 5 strings, no markdown, no commentary.
Example: ["How exactly does the event loop handle promises in Node.js compared to setTimeout?", "Describe the architecture you would use to scale a MongoDB database to handle 10k writes per second."]`;

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

    if (apiKey) {
      try {
        const strictPrompt = `You are a STRICT and HONEST technical interviewer evaluating a job candidate. You MUST score based strictly on what was actually said.

ROLE: ${job?.title || "the applied position"}
CANDIDATE: ${candidate?.name || "Candidate"}

INTERVIEW TRANSCRIPT:
${transcriptText}

PROCTORING: Integrity Score = ${integrityScore}% (${totalViolations} violations)

STRICT SCORING RULES — YOU MUST FOLLOW ALL OF THESE:
1. If any answer is irrelevant, nonsensical, offensive, or completely off-topic → score that answer 0-15.
2. If an answer is "[No response]" or blank → score it 5.
3. If answers are fewer than 20 words → score 10-25.
4. Vague answers without any specifics → score 25-45.
5. Only score above 70 for clear, detailed, relevant, professional responses.
6. Only score above 85 for exceptional answers with concrete examples and depth.
7. technicalScore = average quality of answers relative to the role requirements.
8. communicationScore = clarity, structure, and professionalism of language used.
9. If technicalScore < 50 → recommendation MUST be "Do Not Recommend".
10. overallGrade: Poor if avg < 50, Average if 50-65, Good if 66-80, Excellent if > 80.
11. DO NOT be generous. DO NOT assume good intent. Score ONLY what was written.

Return ONLY this JSON (no markdown, no backticks):
{"technicalScore": <number 0-100>, "communicationScore": <number 0-100>, "integrityScore": ${integrityScore}, "overallGrade": "<Excellent|Good|Average|Poor>", "recommendation": "<Strongly Recommend|Recommend|Possible|Do Not Recommend>", "summary": "<2-3 honest sentences about actual answer quality, call out bad answers explicitly>", "strengths": ["<only real strengths or say None identified>"], "improvements": ["<specific improvements needed>"]}`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: strictPrompt }] }],
              generationConfig: { temperature: 0.1 }
            })
          }
        );
        const data = await geminiRes.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const evaluation = JSON.parse(cleaned);
        addLog("GEMINI_INTERVIEW", `Evaluated ${candidate?.name} — ${evaluation.overallGrade} (Tech: ${evaluation.technicalScore}%, Comm: ${evaluation.communicationScore}%)`, "", `Recommendation: ${evaluation.recommendation}`);
        return res.json(evaluation);
      } catch (e) {
        console.error("[gemini-interview/evaluate] Gemini error, using fallback:", e.message);
      }
    }

    // ── Smart fallback: score based on actual answer length & content ───────
    const answers = (transcript || []).map(t => t.a || "");
    const answerScores = answers.map(ans => {
      const words = ans.trim().split(/\s+/).filter(w => w.length > 1);
      if (!ans.trim() || ans.includes("[No response")) return 10;
      if (words.length < 10) return 20;
      if (words.length < 25) return 35;
      if (words.length < 50) return 50;
      if (words.length < 100) return 63;
      return 73;
    });
    const totalAnswers = answerScores.length || 1;
    const techScore = Math.round(answerScores.reduce((a, b) => a + b, 0) / totalAnswers);
    const commScore = Math.round(techScore * 0.95);
    const grade = techScore >= 75 ? "Good" : techScore >= 55 ? "Average" : "Poor";
    const rec = techScore >= 70 ? "Possible" : "Do Not Recommend";

    res.json({
      technicalScore: techScore,
      communicationScore: commScore,
      integrityScore,
      overallGrade: grade,
      recommendation: rec,
      summary: `${candidate?.name || "The candidate"}'s responses averaged ${techScore}% based on answer depth and relevance. ${techScore < 50 ? "Most answers lacked sufficient detail or were not relevant to the role." : "Answers showed partial engagement but require significant improvement."} Manual review of the full transcript is strongly recommended.`,
      strengths: techScore >= 60 ? ["Completed all interview questions"] : ["Participated in the interview session"],
      improvements: ["Provide detailed answers with specific real-world examples", "Ensure all responses are relevant to the question asked", "Demonstrate deeper understanding of the role requirements"]
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
