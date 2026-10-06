# CogniHire (SIFT) — AI Resume Screening, Candidate Ranking & Interview Agent

> **Production Version:** `v1.3.0`  
> **Enterprise Edition:** Google Cloud Run + GCS Persistent Storage  
> **Repository:** `https://github.com/DianaJoseph08/sift-assessment-srm.git`

An enterprise-grade, AI-powered recruitment intelligence platform that screens candidate resumes against client company requirements, audits resume authenticity, conducts head-to-head candidate evaluations, and runs proctored AI technical video interviews.

---

## 🚀 Key Platform Capabilities

1. **Multi-Tenant Client Company Cockpit**
   - Manage discrete corporate client entities (e.g., Motherson Group, SRM Group of Institutions, Apex Technologies).
   - In-place editing of client reply-to email IDs, sender display names, industries, and hiring guidelines.
   - Quick-action shortcuts directly inside role setup (`[✏️ Edit Company]` & `[+ New]`).

2. **Multimodal Resume Parsing & 4-Pillar Algorithmic Scoring**
   - Concurrent parsing of PDF, Word (.docx), and Plain Text resumes.
   - Deterministic weighted formula:
     $$\text{Overall Fit} = (\text{Skills} \times 0.40) + (\text{Experience} \times 0.25) + (\text{Domain} \times 0.20) + (\text{Education} \times 0.15)$$
   - Strict -15 point mathematical penalty per missing mandatory skill.
   - Strict Academic Discipline Enforcer for faculty/research positions vs. practical skill-first evaluation for engineering roles.

3. **Dual-Tier AI Resume Authenticity & Fraud Defense**
   - **Adversarial Prompt-Injection Sanitizer**: Strips hidden instructions, zero-width tricks, and model override commands.
   - **5-Word N-Gram JD Echo Engine**: Calculates verbatim overlap against the target job description ($N=5$) to catch ChatGPT-tailored resumes.
   - **Career Timeline Validator**: Scans for graduation-to-tenure discrepancies and impossible dates.
   - **Authenticity Badges**: Color-coded recruiter badges (`Verified Clean`, `Suspected AI Tailoring`, `High AI Risk`) across cards, drawers, and export files.

4. **Head-to-Head Candidate Comparison Matrix**
   - Side-by-side comparative analysis of 2 to 5 top candidates.
   - 2D frozen grid navigation: sticky top candidate row and sticky left metric column.
   - Automated mathematical score delta justification against the #1 ranked candidate.
   - "Ask Claude to Compare": One-click synthesis of a 4-part executive memorandum (Verdict, Winner Deep-Dive, Key Differentiating Factors, Recruiter Advice).

5. **Proctored AI Video Interview & Anti-Teleprompter Detection**
   - 30-minute global countdown timer across 5 technical questions (self-paced, low-stress).
   - Dynamic conversational probing powered by Anthropic Claude.
   - **Google MediaPipe Vision AI**: 468-point 3D facial mesh, iris gaze offset, head yaw, face presence, and multi-person detection.
   - **Keystroke Cadence Analysis (`transcriptionSuspected`)**: Flags sustained bursts ($\ge 80\text{ WPM}$ with $<3\%$ backspaces) indicating a candidate copying answers from a smartphone placed in front of the screen.
   - **Sustained Downward Gaze Tracking ($>3.5\text{s}$)**: Flags reading from an off-screen phone or desk notes.
   - **ChatGPT Stylometry Evaluator**: Audits completed answers for AI writing signatures and calculates an `AI Content Risk %`.

6. **In-App Version Control & Release Changelog (`v1.3.0`)**
   - Real-time version badges on the sidebar navigation, welcome banner, and settings panel.
   - Slide-in `ChangelogModal` showcasing the complete release history from `v1.0.0` through `v1.3.0`.
   - Backend health and version endpoint: `GET /api/version`.

7. **Zero-Data-Loss Cloud Storage Architecture**
   - Deployed on Google Cloud Run serverless in `asia-south1` (Mumbai).
   - SQLite backed by persistent Google Cloud Storage bucket (`gs://cognihire-app-data`) via Cloud Storage FUSE.
   - WAL-checkpointed atomic synchronization (`syncToPersistentStorage`) ensuring 100% data durability across scale-to-zero cycles.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5, Recharts 2, Lucide React, Google MediaPipe (`@mediapipe/tasks-vision`).
- **Backend**: Node.js (v20+ LTS), Express.js 4, `pdf-parse`, `mammoth`, `json5`.
- **Database**: Node.js Native SQLite (`node:sqlite` / SQLite3) + GCS FUSE persistent sync.
- **AI Providers**: Anthropic Claude 3.5 Sonnet / Haiku (Primary), Google Gemini 1.5 Flash, Groq Llama 3.1 8B, Local Heuristic Rule Engine.

---

## ⚡ Quick Start

### 1. Local Development
```bash
# Clone the repository
git clone https://github.com/DianaJoseph08/sift-assessment-srm.git
cd sift-assessment-srm

# Install dependencies (frontend & backend)
npm install

# Configure API keys (optional: can also be configured via UI settings)
cp .env.example .env

# Run both backend (:8787) and frontend (:5173) in development mode
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 2. Production Build & Run
```bash
npm run build
npm start
# Server listens on port 8787 and serves the built client
```

### 3. Deploy to Google Cloud Run
```bash
gcloud run deploy cognihire \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

---

## 📖 Complete Documentation & Study Materials

For full architectural deep-dives, enterprise presentation decks, and technical scoring specifications, consult:
- **[CLIENT_STUDY_MATERIAL.md](file:///D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/CLIENT_STUDY_MATERIAL.md)** — Master Enterprise Presentation & Architecture Guide (v1.3.0).
- **[TECHNICAL_ARCHITECTURE_DOCUMENT.md](file:///D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/TECHNICAL_ARCHITECTURE_DOCUMENT.md)** — Comprehensive Technical Architecture Reference.
- **[PROJECT_CONTEXT_OVERVIEW.md](file:///D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/PROJECT_CONTEXT_OVERVIEW.md)** — Master Context Document for Engineering Handoff.

---

*CogniHire by SRM & Motherson Innovation Lab. All rights reserved.*
