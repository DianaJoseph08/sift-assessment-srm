# 📌 SIFT — AI Resume Shortlisting Engine (Master Project Context)

> **Copy and paste this document into any new AI chat session on another laptop to give the AI full context about this project.**

---

## 🚀 1. Project Overview & Objective

**SIFT** is a production-grade, AI-powered **Candidate Screening, Ranking, and Recommendation Engine**. It acts as an agency portal where recruitment teams manage multiple target **Client Companies**, define specific **Job Openings**, upload candidate resumes (PDF, DOCX, TXT), and execute automated AI evaluations.

### Target Client Portfolios Currently Managed:
1. **Motherson Group**: Automotive & Manufacturing OEM partner (e.g. High-Pressure Die Casting (HPDC) Design Engineer).
2. **SRM Group / IST**: Academic & R&D Institute (e.g. Assistant Professor — Mathematics, Research Faculty — Biomedical Engineering).
3. **Bosch India**: Automotive & Embedded Engineering R&D partner.

---

## 🛠️ 2. Technology Stack & Architecture

- **Frontend**: React 18, Vite, Lucide-React Icons, Recharts (Radar & Subscore visual charts), Vanilla CSS custom design system.
- **Themes**: Light, Dark, SRM Blue/Navy, and Glassmorphism mode.
- **Backend Server**: Node.js + Express (`server/index.js`).
- **Database**: SQLite (`server/db.js` storing to `server/sift.db`) with full transactional persistence for companies, jobs, candidates, and activity logs.
- **Document Parsers**: `pdf-parse` (PDF text extraction), `mammoth` (Word .docx text extraction).
- **AI Screening Providers**:
  - **Local LLM / Local AI Rule Engine (Default)**: Offline, <100ms latency, zero API costs, zero external dependency.
  - **Anthropic Claude 3.5 Sonnet / 3.5 Haiku**: High-precision evaluation using official `@anthropic-ai/sdk` with automatic endpoint resiliency.
  - **Google Gemini 1.5 Flash**: Fast structured scoring.
  - **Groq Llama 3.1 8B**: Ultra-fast open-weight screening.

---

## 📋 3. Key Workflows & Features

### A. Client Companies Management
- View, create, and delete client company profiles.
- Filter dashboard and job openings by target client company.

### B. Job Openings Pipeline & Controls
- Define job title, seniority level, minimum experience years, location, and detailed job description.
- **Skill Criteria Editor**: Add required "Must-Have Skills" (primary evaluation weight) and "Nice-to-Have Skills".
- **Action Toolbar**: Explicit **"💾 Save Job Opening"** button (saves changes directly to SQLite with visual checkmark feedback) and **"🗑️ Delete Job Opening"** button.

### C. Automated AI Resume Evaluation Engine
- Supports drag-and-drop batch upload of PDF, DOCX, and TXT files, as well as text pasting and sample loading.
- Evaluates candidate fit across 4 core dimensions:
  1. **Must-Have Skills Match (40%)**: Audits presence of required skills in resume text.
  2. **Experience Alignment (30%)**: Compares extracted candidate experience against job requirements.
  3. **Education & Degree Discipline (15%)**:
     - *Strict Academic Enforcer*: For academic teaching/faculty roles (e.g., "Assistant Professor - Mathematics"), enforces strict degree discipline matching (Ph.D./Master's in Mathematics). Mismatched degrees receive a domain penalty.
     - *Flexible Industry Enforcer*: For industry engineering roles, prioritizes practical technical skills over exact degree major.
  4. **Domain Alignment (15%)**: Evaluates overall background suitability.
- Outputs structured radar subscores, fit recommendations (Strong / Good / Possible / Weak Match), key strengths, gaps, and custom technical interview questions.

### D. Interactive Candidate Interview Simulation
- Simulated AI interview session where candidates answer role-specific technical questions via voice/text with post-interview AI performance scoring.

### E. Data Persistence & Export
- All candidates, results, and criteria are saved in local SQLite database (`server/sift.db`).
- Export shortlisted candidates to CSV.

---

## 📂 4. Repository Structure

```text
sift-resume-agent/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── App.jsx             # Main Application Logic & UI Components
│   │   ├── api.js              # API Bridge to Node.js Backend
│   │   └── main.jsx            # Entry point
│   └── package.json
├── server/                     # Express Backend
│   ├── index.js                # Express Server API Endpoints
│   ├── db.js                   # SQLite Database & Migration Manager
│   ├── analyze.js              # AI Evaluation Engine (Claude, Gemini, Groq, Local)
│   └── sift.db                 # Local Persistent SQLite Database
├── start-local.bat             # 1-Click Startup Script for Windows
├── start-local.sh              # 1-Click Startup Script for Mac/Linux
├── package.json                # Root Concurrently Script Runner
└── PROJECT_CONTEXT_OVERVIEW.md # Master Context Document
```

---

## ⚡ 5. How to Run Locally on Any Laptop

1. Clone or download the repository:
   ```bash
   git clone https://github.com/DianaJoseph08/sift-assessment-srm.git
   cd sift-assessment-srm
   ```
2. Double-click **`start-local.bat`** (Windows) or run **`./start-local.sh`** (Mac/Linux).
3. Open browser to **`http://localhost:5173`**.
