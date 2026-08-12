# SRM AI Resume Shortlisting & Interview Portal — Complete Rebuild Prompt

Use this prompt to recreate this entire web application from scratch on any AI coding platform (Bolt.new, Lovable, Replit, v0.dev, Cursor, etc.)

---

## FULL PROMPT (Copy everything below this line)

---

Build a full-stack **AI Resume Screening & Shortlist Portal** for **SRM Institute of Science & Technology, Chennai Ramapuram**. This is a recruiter-facing tool for HR teams to screen, score, shortlist, and AI-interview job candidates.

---

## TECH STACK

- **Frontend:** React (Vite), plain CSS-in-JS (inline styles), Recharts for charts, Lucide-React for icons, PapaParse for CSV export
- **Backend:** Node.js + Express
- **Database:** SQLite via `better-sqlite3` — persists jobs & candidates across sessions
- **AI Providers (selectable via dropdown):**
  - **Groq API** (free, default) — model: `llama-3.1-8b-instant`
  - **Gemini API** — model: `gemini-1.5-flash-002`, endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
  - **Claude API** — model: `claude-sonnet-4-6` via `@anthropic-ai/sdk`
  - **Local LLM** — Ollama at `http://127.0.0.1:11434`, model: `llama3.1`
- **File parsing:** `pdf-parse` for PDFs, `mammoth` for DOCX
- **Environment variables:** `LLM_PROVIDER`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `OLLAMA_HOST`, `MODEL`, `PORT`

---

## BRANDING & DESIGN

- **Institution:** SRM Institute of Science & Technology, Chennai Ramapuram
- **App title:** "AI Resume Screening & Shortlist Portal"
- **Subtitle:** "Autonomous offline candidate screening, fit scoring, and ranking engine."
- **Color palette:**
  - Background: `#F8FAFC`
  - Paper/Card: `#FFFFFF`
  - Primary text: `#0F172A`
  - Secondary text: `#475569`
  - Faint text: `#94A3B8`
  - Border: `#E2E8F0`
  - Accent (SRM Blue): `#034DA1`
  - Accent Deep: `#023570`
  - Accent Soft: `#EBF3FC`
- **Font:** `'Cambria Math', 'Cambria', Georgia, serif` for all text
- **Score color coding:**
  - ≥75: `#16A34A` (green)
  - ≥55: `#0284C7` (blue)
  - ≥40: `#D97706` (orange)
  - <40: `#DC2626` (red)
- **Recommendation badges:**
  - Strong Match: green `#15803D` / bg `#DCFCE7`
  - Good Match: blue `#0369A1` / bg `#E0F2FE`
  - Possible Match: amber `#B45309` / bg `#FEF3C7`
  - Weak Match: red `#B91C1C` / bg `#FEE2E2`
- **SRM Logo:** SVG with the SRM crest (blue circle with banyan tree), "CHENNAI RAMAPURAM" banner at top, "SRM INSTITUTE OF SCIENCE & TECHNOLOGY" text, and motto "LEARN • LEAP • LEAD"
- **Header:** Shows SRM logo on left, app title and subtitle in center, LLM provider dropdown + settings icon + "Back to Dashboard" button on right

---

## APPLICATION VIEWS / PAGES

### 1. RECRUITER DASHBOARD (home)
- Shows a grid of **Job Cards** — each card displays:
  - Job title, seniority badge, location, years experience
  - Stats: total candidates screened, shortlisted count, average score
  - Progress bar (shortlisted/total)
  - "View Results" button → goes to results for that job
  - "Start Screening" button → opens the screening wizard
  - "Send Interview Link" button → copies a shareable candidate interview link to clipboard
- "Create New Job" button opens the screening wizard
- Empty state with illustration if no jobs exist yet
- Jobs persist via SQLite database (fetched from `/api/jobs` on load, saved via `/api/save-jobs`)

### 2. SCREENING WIZARD (3 steps)

#### Step 1 — Define the Role
Form fields:
- Job Title (text input) — required
- Seniority level (dropdown): Intern, Junior, Mid-Level, Senior, Lead, Manager, Director, C-Suite
- Minimum Years of Experience (number input)
- Location / Work Mode (text input)
- Must-Have Skills (tag input — user types and presses Enter or comma to add chips)
- Nice-to-Have Skills (same tag input)
- Job Description (large textarea)
- "Next: Add Candidates →" button

#### Step 2 — Add Candidates
- Drag-and-drop file upload zone for PDF and DOCX resume files (multiple at once)
- Also supports pasting plain text (textarea toggle)
- Shows list of uploaded files with filename, size, and remove button
- Previously screened candidates from the same job show in a "Carry Forward" list with their old score — checkbox to include them (uses cached result, does not re-analyze)
- "Run Screening →" button starts the AI analysis

#### Step 3 — Review Shortlist (Results)
- Stats bar: Screened, Shortlisted, Average Fit, Top Candidate
- Shortlist cutoff slider (0–100) — candidates above cutoff are "Shortlisted"
- Tabs: All | Shortlisted Only
- Sort dropdown: By score (default), By name, By experience
- "Export CSV" button — downloads results as CSV
- Each candidate shown as an expandable **CandidateCard** with:
  - Rank badge, name, current title, years of experience, education
  - Recommendation badge (Strong/Good/Possible/Weak Match)
  - Overall score (large, color coded)
  - Subscores radar chart: Skills, Experience, Education, Domain Fit
  - Bar chart of subscores
  - Strengths list (green checkmarks)
  - Gaps list (red X marks)
  - Missing must-have skills (red chips)
  - Top skills chips
  - Summary sentence
  - 3 AI-generated interview questions
  - Email address extracted from resume
  - "Start Interview" button → opens the AI interviewer for that candidate

---

## AI RESUME SCREENING LOGIC

### Scoring Prompt (system prompt for AI):
```
You are a strict, highly rigorous technical recruiter and academic dean who evaluates candidate resumes against job criteria with extreme precision.

Follow this systematic evaluation process:
1. IDENTIFY ACADEMIC DISCIPLINE: Identify the exact major of the candidate's highest degree. For ACADEMIC roles (Professor, Lecturer, Faculty, Teacher), the degree MUST match the required discipline exactly — a Physics PhD cannot teach Mathematics. For INDUSTRY roles (Engineer, Developer, Analyst, Manager), focus on skills and experience, NOT degree discipline.
2. AUDIT MUST-HAVE SKILLS: Check each required skill. Deduct 15 points from skills subscore for each missing must-have.
3. EVALUATE EXPERIENCE: Sum total years of work experience. Check if it meets minimum required.
4. ENFORCE SCORE RULES: For academic roles with discipline mismatch: domain score MUST be under 30, overall score MUST be under 40.
```

### Output JSON Schema (returned by AI):
```json
{
  "requiredDiscipline": "string",
  "candidateDiscipline": "string",
  "domainFitReasoning": "string",
  "candidateName": "string",
  "email": "string (from extracted emails list only, never hallucinate)",
  "currentTitle": "string",
  "yearsExperience": number,
  "education": "string",
  "topSkills": ["string"] (max 8),
  "subScores": {
    "skills": number (0-100),
    "experience": number (0-100),
    "education": number (0-100),
    "domain": number (0-100)
  },
  "overallScore": number (0-100),
  "recommendation": "Strong Match" | "Good Match" | "Possible Match" | "Weak Match",
  "summary": "string (one sentence)",
  "strengths": ["string"] (2-4 items),
  "gaps": ["string"] (1-4 items),
  "missingMustHaves": ["string"],
  "interviewQuestions": ["string"] (exactly 3),
  "interviewFocus": "string"
}
```

### Email extraction:
- Before sending to AI, extract all email addresses from raw resume text using regex
- Pass the extracted list to AI in the prompt schema so it only selects from verified emails
- Post-process AI response: validate email against extracted list, use fuzzy matching if needed

### PDF handling:
- For Claude: send PDF as base64 document block (native PDF vision)
- For all others: parse text using `pdf-parse`, send as plain text

### Multi-provider routing:
```javascript
if (provider === "ollama") → analyzeWithOllama()
else if (provider === "gemini") → analyzeWithGemini()
else if (provider === "groq") → analyzeWithGroq()
else → analyzeWithClaude()  // default
```

---

## AI INTERVIEWER FEATURE

### Recruiter-side ("Start Interview"):
- Opens a full-screen chat UI for the recruiter to conduct an AI-assisted interview
- System prompt: "You are a professional, polite, but highly rigorous technical interviewer at SRM Group of Institutions interviewing a candidate for the role: [JOB TITLE]. Based on their resume showing [SKILLS], ask exactly ONE interview question at a time..."
- Chat history sent with each request to maintain conversation context
- After 5+ exchanges, "End & Evaluate" button appears
- Evaluation generates: overall score (0-100), performance summary, strengths, areas of concern, hiring recommendation, detailed feedback per answer
- Results shown in a modal with radar chart

### Candidate-side ("Remote Interview Room"):
- Accessed via a unique URL: `/interview?id=[candidateId]`
- Full-screen immersive interview room with:
  - Candidate name and job title shown
  - AI interviewer avatar / chat interface
  - **Speech-to-text** input (Web Speech API) + text input
  - **Text-to-speech** output (Web Speech API — AI speaks questions aloud)
  - Proctoring: detects tab switches (document visibility API), counts violations
  - Timer per question (optional)
  - Auto-submits evaluation when interview ends
  - Results saved to database via `/api/candidate-interview-submit`

---

## API ENDPOINTS

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/analyze` | Screen one resume: `{job, resume, provider}` |
| POST | `/api/interview/chat` | Get next AI interview question: `{job, candidate, history, provider}` |
| POST | `/api/interview/evaluate` | Evaluate completed interview: `{job, candidate, history, proctoring, provider}` |
| GET | `/api/candidate-interview-info` | Get candidate info for remote room: `?candidateId=xxx` |
| POST | `/api/candidate-interview-submit` | Submit candidate interview results: `{candidateId, score, summary, transcript, proctoring}` |
| GET | `/api/jobs` | Fetch all jobs + candidates from SQLite |
| POST | `/api/save-jobs` | Save all jobs + candidates to SQLite |

---

## DATABASE SCHEMA (SQLite)

### Table: `jobs`
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL  -- Full JSON of job object including all candidates
);
```

### Table: `candidates`
```sql
CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  jobId TEXT,
  label TEXT,
  kind TEXT,  -- 'file' or 'text'
  filename TEXT,
  base64 TEXT,  -- base64 encoded file content
  text TEXT,    -- for text resumes
  result TEXT,  -- JSON of AI screening result
  interview TEXT  -- JSON of interview evaluation result
);
```

---

## LLM PROVIDER IMPLEMENTATIONS

### Groq (Free tier):
```javascript
const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
  body: JSON.stringify({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMessage }],
    temperature: 0.1,
    response_format: { type: "json_object" }
  })
});
```

### Gemini:
```javascript
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-002:generateContent`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    systemInstruction: { parts: [{ text: SYSTEM }] },
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
  })
});
```

### Claude:
```javascript
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY, maxRetries: 3 });
const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1200,
  system: SYSTEM,
  messages: [{ role: "user", content }]  // content can include PDF document blocks
});
```

### Ollama (Local):
```javascript
const response = await fetch("http://127.0.0.1:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "llama3.1",
    messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMessage }],
    stream: false,
    format: "json",
    options: { temperature: 0.1 }
  })
});
```

---

## FRONTEND KEY COMPONENTS

1. **`<Dashboard />`** — Job card grid, create new job button
2. **`<WizardStep1 />`** — Role definition form with tag inputs
3. **`<WizardStep2 />`** — File upload + carry-forward candidates
4. **`<AnalyzingStep />`** — Progress screen showing real-time per-resume status (queued → analyzing → done/error)
5. **`<ResultsStep />`** — Shortlist view with slider, sort, export
6. **`<CandidateCard />`** — Expandable card with charts and details
7. **`<AIInterviewRoom />`** — Recruiter interview chat UI
8. **`<RemoteInterviewRoom />`** — Candidate-facing interview with TTS/STT
9. **`<SettingsPanel />`** — Slide-in drawer to manage API keys (saves to localStorage)

---

## KEY UX BEHAVIORS

- **Screening runs in sequence** (one at a time with 500ms delay between) to avoid rate limits
- **Carry-forward:** Re-running screening on a job reuses existing results for unchanged candidates
- **Persistent state:** All jobs/candidates survive server restarts via SQLite
- **Export CSV:** Downloads all screening results with score, recommendation, skills, email
- **Shareable interview link:** Recruiter clicks "Send Interview Link" → copies URL to clipboard → candidate opens in browser to take AI interview
- **Settings panel:** Gear icon in header opens a slide-in panel where user can paste API keys — stored in localStorage, sent with each API request
- **LLM dropdown:** Top-right dropdown switches between Local LLM / Gemini API / Claude API / Groq API (Free) — selection is passed with each API call as `provider` field
- **Error display:** Failed candidates show exact error message inline in red
- **Retry support:** "Try re-running" link next to failed candidates

---

## DEPLOYMENT

- **Build:** `npm run build` in `/client` folder → outputs to `/dist`
- **Start:** `node server/index.js` — serves both API and static frontend
- **Environment:** Set env vars in platform settings (Render, Railway, etc.)
- **Required env vars for cloud deployment:**
  ```
  LLM_PROVIDER=groq
  GROQ_API_KEY=gsk_...
  GEMINI_API_KEY=AIza...  (optional)
  ANTHROPIC_API_KEY=sk-ant-...  (optional)
  PORT=8787
  ```

---

## PIPELINE DESCRIPTION (shown in footer)
"Pipeline: define role → ingest resumes (PDF / DOCX / TXT) → AI agent parses & scores each resume → rank, shortlist & recommend."

---
*End of prompt. This is a production-grade application used by SRM Institute of Science & Technology for automated HR screening.*
