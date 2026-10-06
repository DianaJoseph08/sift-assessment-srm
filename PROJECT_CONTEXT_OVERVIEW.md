# 📌 CogniHire (SIFT) — AI Candidate Screening, Ranking & Interview Agent (Master Project Context)

> **Platform Version:** v1.3.0 (Enterprise Cloud Edition)  
> **Repository:** `https://github.com/DianaJoseph08/sift-assessment-srm.git` (branch `main`)  
> **Copy and paste this document into any new AI chat session or developer handoff to give full context about this project.**

---

## 🚀 1. Project Overview & Objective

**CogniHire (SIFT)** is an enterprise-grade, autonomous talent acquisition and candidate evaluation platform. It operates as a multi-tenant agency cockpit where recruitment teams:
1. Register and edit multiple target **Client Companies** (Motherson Group, SRM Group of Institutions, Apex Technologies, etc.) with dedicated reply-to email IDs and sender branding.
2. Define specific **Job Openings** with weighted must-have and nice-to-have competencies and academic discipline enforcers.
3. Ingest candidate resumes in bulk (PDF, DOCX, TXT) and run automated **AI Resume Screening** and **Fraud / Authenticity Auditing**.
4. Review side-by-side **Candidate Comparison Matrices** with frozen grid navigation and Claude-synthesized executive memos.
5. Invite shortlisted candidates to take a proctored, 30-minute self-paced **AI Technical Video Interview** featuring real-time MediaPipe facial biometrics, keystroke transcription dynamics, and ChatGPT stylometry auditing.
6. Export structured shortlists as CSV and report recommendations back to client companies.

---

## 🛠️ 2. Technology Stack & Architecture

- **Frontend**:
  - React 18, Vite 5, Lucide-React Icons, Recharts (Radar & Subscore charts).
  - Google MediaPipe (`@mediapipe/tasks-vision`) WebAssembly FaceLandmarker running client-side at 30+ FPS.
  - Multi-theme engine (Light, Dark, SRM Navy, Glassmorphism).
  - In-app version control badges and interactive release changelog modal (`v1.3.0`).
- **Backend**:
  - Node.js (v20+ LTS) + Express.js 4 (`server/index.js`).
  - Document parsers: `pdf-parse` (binary PDF text extraction) and `mammoth` (Word .docx text extraction).
  - Resilient JSON parser: `json5` (fault-tolerant against markdown fences and LLM formatting quirks).
  - Runtime version API: `GET /api/version`.
- **Database & Zero-Data-Loss Persistence**:
  - Node.js Native SQLite (`DatabaseSync` / SQLite3) storing to `server/sift.db` / `/tmp/sift.db`.
  - Google Cloud Storage (GCS) FUSE volume mounted at `/app/data` (`gs://cognihire-app-data`).
  - WAL-checkpointed atomic synchronization (`syncToPersistentStorage`) with automatic cold-boot restoration.
- **AI & Evaluation Engines**:
  - **Anthropic Claude 3.5 Sonnet / Haiku**: Flagship resume parsing, entity extraction, comparison synthesis, and dynamic video interviewing.
  - **Google Gemini 1.5 Flash / Groq Llama 3.1 8B**: Fast alternative cloud models.
  - **Local Heuristic / Offline Rule Engine**: Fallback scoring when cloud API keys are disabled.
  - **Adversarial Text Sanitizer (`sanitizeResumeText`)**: Detects and neutralizes prompt injection payloads.
  - **5-Word N-Gram Echo Engine (`calculateJDEcho`)**: Catches ChatGPT-tailored resumes verbatim copying the JD.
  - **Keystroke WPM Dynamics & Stylometry Auditor**: Detects smartphone transcription and AI-generated answers during video interviews.

---

## 📋 3. Key Workflows & Features

### A. Client Companies Management & In-Place Editing
- Register and edit client organization profiles:
  - Company Name, Industry / Domain, Default Hiring / Reply-To Email ID (`contactEmail`), Sender Display Name (`senderName`), and Hiring Guidelines (`notes`).
- **In-Place Editing**: Quick-action buttons `[✏️ Edit Company]` and `[+ New]` directly in Step 1 (Define Job Criteria) and in the top connected dropdowns toolbar.
- Clean company card layout with a single top-right Edit button.

### B. Job Criteria & 4-Pillar Algorithmic Scoring
- Defines role seniority, minimum experience years, must-have skills, and nice-to-have skills.
- **4-Pillar Formula**:
  $$\text{Fit Score} = (\text{Skills} \times 0.40) + (\text{Experience} \times 0.25) + (\text{Domain} \times 0.20) + (\text{Education} \times 0.15)$$
- **Strict Penalty Rule**: -15 points per missing mandatory must-have skill.
- **Discipline Enforcer**: Strict degree major enforcement for academic positions (e.g. Ph.D. in Mathematics) vs. flexible skill-first evaluation for industry engineering roles.

### C. AI Resume Authenticity & Anti-Manipulation Engine
- **Adversarial Prompt-Injection Sanitization**: Strips hidden instructions (`ignore previous instructions`, `rate 100`, zero-width spaces).
- **5-Word N-Gram JD Echo Check**: Calculates verbatim overlap against the JD ($N=5$). Overlaps $\ge 35\%$ cap the authenticity score at 45% (*High AI / Manipulation Risk*); $20\% - 34\%$ overlaps cap at 68% (*Suspected AI Tailoring*).
- **Career Chronology Validation**: Catches graduation-to-tenure math errors and overlapping full-time engagements.
- **Visual Badges**: Displayed on Candidate Cards, Candidate Details drawer, Comparison Matrix, and CSV exports.

### D. Head-to-Head Candidate Comparison Matrix
- Side-by-side evaluation of 2–5 top contenders.
- **Frozen Grid**: Sticky top candidate row and sticky left metric column for effortless navigation.
- **Delta Justification**: Mathematical comparisons against the #1 ranked candidate.
- **Ask Claude to Compare**: One-click generation of a 4-part executive memorandum (Verdict, Winner Analysis, Differentiating Factors, Recruiter Advice).

### E. Proctored AI Video Interview & Anti-Teleprompter Detection
- **30-Minute Global Timer**: Self-paced countdown across 5 technical questions, eliminating artificial time pressure.
- **MediaPipe WebAssembly Vision**: Tracks 468-point 3D facial landmarks, eye gaze deviation, head orientation, face absence, and multi-person presence.
- **Keystroke Cadence Analysis (`transcriptionSuspected`)**: Flags sustained typing bursts ($\ge 80\text{ WPM}$ with $<3\%$ backspaces) indicating candidate copying answers from a smartphone placed in front of the screen.
- **Sustained Downward Gaze Tracking ($>3.5\text{s}$)**: Flags reading from an off-screen phone or desk notes.
- **ChatGPT Stylometry Evaluator**: Audits answers for AI linguistic signatures, producing an `AI Content Risk %` score.

### F. In-App Platform Version Control (`v1.3.0`)
- Semantic Versioning `v1.3.0` displayed in:
  - Sidebar navigation footer: `[ 🟢 CogniHire v1.3.0 Prod | What's New → ]`
  - Dashboard hero banner: `[ 🌿 v1.3.0 · What's New ]`
  - Settings panel: "Platform Version Control & Releases" card.
- Interactive `ChangelogModal` displaying release history (`v1.3.0`, `v1.2.0`, `v1.1.0`, `v1.0.0`).

---

## 📂 4. Repository Structure

```text
sift-resume-agent/
├── client/                              # React Frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                      # Main UI, Router, Changelog & Wizard
│   │   ├── VideoInterview.jsx           # MediaPipe Proctored Video Interview
│   │   ├── api.js                       # API Client Bridge
│   │   └── main.jsx                     # Vite Application Entry Point
│   └── package.json
├── server/                              # Express Backend
│   ├── index.js                         # REST Endpoints, /api/version, GCS Sync
│   ├── analyze.js                       # AI Engine, Authenticity, Stylometry
│   ├── db.js                            # SQLite Database & Migration Manager
│   └── sift.db                          # Persistent SQLite Database
├── dist/                                # Production Compiled Frontend Bundle
├── Dockerfile                           # Production Cloud Run Container Build
├── start-local.bat                      # 1-Click Startup Script for Windows
├── start-local.sh                       # 1-Click Startup Script for Mac/Linux
├── package.json                         # Version 1.3.0 & Script Orchestrator
├── CLIENT_STUDY_MATERIAL.md             # Enterprise Presentation & Technical Guide
├── TECHNICAL_ARCHITECTURE_DOCUMENT.md   # Architectural Reference Guide
└── PROJECT_CONTEXT_OVERVIEW.md          # Master Project Context
```

---

## ⚡ 5. Execution & Deployment

### Run Locally (Development)
```bash
git clone https://github.com/DianaJoseph08/sift-assessment-srm.git
cd sift-assessment-srm
npm install
npm run dev
# Open browser to http://localhost:5173
```

### Production Build & Run
```bash
npm run build
npm start
# Server listens on port 8787 (serving API and static bundle)
```

### Deploy to Google Cloud Run
```bash
cd ~/sift-assessment-srm
git pull origin main
gcloud run deploy cognihire --source . --region asia-south1
```
