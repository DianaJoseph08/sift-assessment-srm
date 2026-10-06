# CogniHire (SIFT): Enterprise Technical Architecture & Client Presentation Guide

> **Confidential & Proprietary**  
> **Prepared for:** Executive Leadership, HR Directors, Client Technical Teams & Enterprise Evaluators  
> **Platform Version:** v1.3.0 (Enterprise Cloud Edition)  
> **Release Date:** October 2026  
> **Deployment Target:** Google Cloud Run (`asia-south1`) + Google Cloud Storage FUSE (`gs://cognihire-app-data`)

---

## Table of Contents
1. [Executive Summary & Business Value](#1-executive-summary--business-value)
2. [Complete Technology Stack & System Specifications](#2-complete-technology-stack--system-specifications)
3. [End-to-End System Workflow Architecture](#3-end-to-end-system-workflow-architecture)
4. [Multimodal Resume Parsing & 4-Pillar Algorithmic Scoring](#4-multimodal-resume-parsing--4-pillar-algorithmic-scoring)
5. [Dual-Tier AI Resume Authenticity & Anti-Manipulation Engine](#5-dual-tier-ai-resume-authenticity--anti-manipulation-engine)
6. [Head-to-Head Candidate Comparison Matrix](#6-head-to-head-candidate-comparison-matrix)
7. [Autonomous AI Video Interview, Vision Proctoring & Anti-Teleprompter Detection](#7-autonomous-ai-video-interview-vision-proctoring--anti-teleprompter-detection)
8. [Multi-Tenant Corporate Management, Sender Identity & Email Routing](#8-multi-tenant-corporate-management-sender-identity--email-routing)
9. [Cloud Infrastructure, Serverless Hosting & Zero-Data-Loss Architecture](#9-cloud-infrastructure-serverless-hosting--zero-data-loss-architecture)
10. [Enterprise Release Management, Semantic Versioning & In-App Changelog](#10-enterprise-release-management-semantic-versioning--in-app-changelog)
11. [Client FAQ & Enterprise Due Diligence Questionnaire](#11-client-faq--enterprise-due-diligence-questionnaire)

---

## 1. Executive Summary & Business Value

**CogniHire (SIFT)** is an enterprise-grade, autonomous talent acquisition and candidate evaluation platform designed to eliminate recruiter bottlenecks, eradicate subjective hiring bias, prevent AI-generated resume fraud, and accelerate the shortlisting-to-interview cycle by up to **85%**.

Unlike legacy Applicant Tracking Systems (ATS) that rely on superficial keyword matching or generic video recording widgets, CogniHire operates as an active, intelligent evaluation pipeline:
- **Multi-Tenant Corporate Segregation:** Centralized recruiter cockpit managing isolated client enterprise profiles (e.g., Motherson Group, SRM Group of Institutions, Apex Technologies) with dedicated reply-to email IDs, sender branding, and custom evaluation criteria.
- **AI Fraud & Manipulation Defense:** Automated detection of ChatGPT-generated resumes, adversarial prompt-injection attacks, 5-word verbatim job description copying, and smartphone-assisted video interview cheating.
- **Deterministic 4-Pillar Scoring:** Transparent, audit-proof mathematical scoring combining technical must-have skills, career tenure, domain depth, and academic pedigree.
- **Head-to-Head Candidate Matrix:** High-density side-by-side comparison tables with frozen navigation, mathematical delta justifications, and Anthropic Claude-synthesized executive memos.
- **Browser-Native Proctored AI Video Interview:** 30-minute self-paced technical interview featuring dynamic conversational probing, MediaPipe facial biometrics, keystroke transcription dynamics, and ChatGPT stylometry auditing.

---

## 2. Complete Technology Stack & System Specifications

CogniHire is built on a modern, decoupled microservices web architecture engineered for sub-second user responsiveness, enterprise cloud reliability, and high-concurrency throughput.

### A. Frontend Layer (User Experience & Client Biometrics)
| Component | Technology | Technical Purpose & Justification |
| :--- | :--- | :--- |
| **Language** | JavaScript (ES6+ / JSX) | Modern declarative syntax with strict component scoping. |
| **UI Framework** | React 18 (`react`, `react-dom`) | High-performance reactive virtual DOM ensuring instantaneous UI state synchronization across large candidate datasets. |
| **Bundler & Build Tool** | Vite 5 (`vite`, `@vitejs/plugin-react`) | Sub-second Hot Module Replacement (HMR) and optimized Rollup-based tree-shaken production bundles. |
| **Data Visualization** | Recharts 2 (`recharts`) | D3-powered responsive radar charts, sub-score breakdown bars, and interactive skill delta meters. |
| **Iconography & Design System** | Lucide React (`lucide-react`) | Modular, tree-shakable SVG icons matching enterprise theme standards. |
| **Document Exporting** | PapaParse (`papaparse`) | High-speed client-side CSV serialization for structured recruiter spreadsheet downloads. |
| **Client-Side Computer Vision** | Google MediaPipe (`@mediapipe/tasks-vision`) | WebAssembly-compiled 468-point 3D facial landmark detection (`FaceLandmarker`) running locally in candidate browsers at 30+ FPS. |

### B. Backend Layer (API, Ingestion & Orchestration)
| Component | Technology | Technical Purpose & Justification |
| :--- | :--- | :--- |
| **Runtime Environment** | Node.js (v20+ LTS) | Non-blocking, event-driven asynchronous runtime designed for concurrent document streams and low-latency API handling. |
| **Server Framework** | Express.js 4 (`express`) | Lightweight REST API server with custom CORS negotiation, JSON streaming, and 30MB+ payload capacity for high-resolution resumes. |
| **Document Parsers** | `pdf-parse` & `mammoth` | Binary stream decoders that extract raw text, document formatting, and metadata from PDF, DOCX, and TXT resumes. |
| **Fault-Tolerant Parser** | `json5` | Resilient JSON parser capable of parsing LLM structured outputs containing trailing commas, comments, or markdown fences. |
| **Config & Environment** | `dotenv` | Secure environment variable isolation protecting cloud keys and host ports. |

### C. Artificial Intelligence, NLP & Stylometry Engines
| Capability | Model / Engine | Operational Role |
| :--- | :--- | :--- |
| **Primary Evaluation LLM** | **Anthropic Claude 3.5 Sonnet / Haiku** | Multi-step resume entity extraction, must-have skill verification, executive candidate comparison memos, dynamic interview question generation. |
| **Alternative Cloud Models** | **Google Gemini 1.5 Flash / Groq Llama 3.1** | Pluggable alternative LLM providers for high-availability cloud fallback and cost optimization. |
| **Air-Gapped / Local Inference** | **Ollama (Llama 3.1 / Mistral)** | On-premise offline LLM inferencing support for security-restricted enterprise intranet installations. |
| **Adversarial Text Sanitizer** | Regex AST Scanner (`sanitizeResumeText`) | Neutralizes prompt injection payloads, zero-width text exploits, and model override commands. |
| **N-Gram JD Echo Engine** | 5-Word Sequence Overlap (`calculateJDEcho`) | Calculates mathematical n-gram similarity against the target Job Description to detect ChatGPT-tailored resumes. |
| **Linguistic Stylometry Auditor** | Claude Stylometry Evaluator | Detects AI writing signatures in candidate interview answers (conversational signposts, rigid enumerations, unnatural structural symmetry). |

### D. Data Storage & Zero-Data-Loss Architecture
| Component | Technology | Technical Purpose & Justification |
| :--- | :--- | :--- |
| **Relational Database** | **Node.js Native SQLite (`node:sqlite` / `DatabaseSync`)** | Zero-latency, ACID-compliant transactional SQL database running in-memory and on POSIX disk. |
| **Persistent Cloud Volume** | **Google Cloud Storage (GCS) FUSE Mount** | Dedicated cloud storage bucket `gs://cognihire-app-data` mounted at `/app/data` delivering 99.999999999% data durability. |
| **Atomic Sync Engine** | Custom WAL Synchronizer (`syncToPersistentStorage`) | Passive WAL checkpointing ensuring zero database corruption when mirroring local container disk to persistent Cloud Storage. |

### E. Cloud Hosting & Enterprise DevOps
| Component | Service | Specifications |
| :--- | :--- | :--- |
| **Compute Platform** | **Google Cloud Run (Serverless)** | Containerized microservice in region `asia-south1` (Mumbai) with automatic scaling from 0 to N instances. |
| **Container Engine** | **Docker (Linux Debian Slim)** | Multi-stage Docker container serving frontend static assets and backend API on port 8080. |
| **Version Control & CI/CD** | **GitHub (`origin/main`)** | Versioned release tags, fast-forward branch tracking, and reproducible deployment scripts. |

---

## 3. End-to-End System Workflow Architecture

```
[1. Client Company Management]  ── Register/Edit Client Entity (Default Reply-To Email, Sender Identity, Guidelines)
             │
             ▼
[2. Define Job Criteria & Rules] ── Target Company, Seniority, Must-Have & Nice-to-Have Skills, Discipline Enforcer
             │
             ▼
[3. Multimodal Resume Ingestion] ── Batch upload of PDF, DOCX, and TXT files (Parallel extraction)
             │
             ▼
[4. Dual-Tier Authenticity Audit] ── Prompt Injection Sanitization + 5-Word N-Gram Echo Check + Chronology Validation
             │
             ▼
[5. 4-Pillar Algorithmic Scoring]── Skills (40%), Experience (25%), Domain (20%), Education (15%)
             │
             ▼
[6. Candidate Comparison Matrix] ── Head-to-Head Frozen Matrix, Mathematical Deltas, Claude Executive Memo
             │
             ▼
[7. Autonomous AI Video Interview]── 30-min global timer, MediaPipe Vision Telemetry + WPM Cadence + Stylometry Audit
             │
             ▼
[8. Client Reporting & Outbound] ── Shortlist CSV Export, Formatted Candidate Dossiers, Corporate Email Dispatch
```

---

## 4. Multimodal Resume Parsing & 4-Pillar Algorithmic Scoring

CogniHire eliminates subjective recruiter bias and keyword-stuffing exploits by applying a deterministic 4-pillar evaluation formula:

$$\text{Overall Fit Score} = (\text{Skills} \times 0.40) + (\text{Experience} \times 0.25) + (\text{Domain} \times 0.20) + (\text{Education} \times 0.15)$$

### Detailed Pillar Breakdown:

1. **Technical Skills Fit (40% Weight):**
   - **Mandatory Must-Have Verification:** Strict auditing of primary skills defined in the job setup.
   - **Mathematical Penalty Rule:** Each missing mandatory must-have skill automatically deducts **15 points** from the Skills Subscore.
   - **Nice-to-Have Depth:** Secondary tools and complementary frameworks contribute positively to score depth without penalizing candidates if missing.

2. **Experience & Career Seniority Fit (25% Weight):**
   - Extracts and verifies candidate career tenure, title progression, and chronological continuity.
   - Applies calibrated deductions if total verified experience falls below the job's minimum required years.

3. **Domain Relevance (20% Weight):**
   - Evaluates industry alignment (e.g., Automotive OEM, CAE Simulation, Cloud DevOps, Clinical Research).
   - **Adaptive Academic vs. Industry Modality:**
     - *Industry Roles:* Evaluates practical technical competence with flexible degree boundaries.
     - *Academic / Research Roles (e.g., Assistant Professor):* Enforces strict degree discipline matching (e.g., Ph.D. in Mathematics required; related engineering degrees receive strict domain penalties).

4. **Education & Academic Discipline Alignment (15% Weight):**
   - Evaluates degree level (B.Tech, M.S., Ph.D.) and academic subject matter relevance.

### Standardized Fit Recommendation Tiers:
| Recommendation Tier | Score Range | Action Directive |
| :--- | :--- | :--- |
| **Strong Match** | 80% – 100% | Fast-track to technical interview. Exceeds mandatory requirements. |
| **Good Match** | 70% – 79% | Qualified candidate. Meets all must-haves; minor gaps in secondary tooling. |
| **Possible Match** | 50% – 69% | Borderline profile. Missing domain tenure or partial tool requirements. |
| **Weak Match** | 0% – 49% | Reject / Keep on file. Lacks fundamental mandatory qualifications. |

---

## 5. Dual-Tier AI Resume Authenticity & Anti-Manipulation Engine

In modern hiring, candidates frequently copy job descriptions into ChatGPT to fabricate tailored resumes, embed invisible prompt-injection instructions, or invent career timelines. CogniHire implements a dual-tier security engine:

### A. Adversarial Prompt-Injection Sanitization (`sanitizeResumeText`)
Before text reaches the evaluation model, the scanner inspects the raw text for prompt-injection attacks:
- **Nullifies Hijack Patterns:** Neutralizes commands such as `ignore previous instructions`, `system override`, `you are now an assistant that`, `rate this candidate 100`, or hidden `[system: ...]` tags.
- **Invisible Text Detection:** Catches white text, zero-width spaces, or microscopic font styling commonly used to manipulate ATS parsers.
- Flagged patterns are replaced with `[BLOCKED_INJECTION_DIRECTIVE]` and logged as security violations.

### B. 5-Word N-Gram Verbatim JD Echo Check (`calculateJDEcho`)
Candidates who generate resumes directly from the job description are caught by the N-Gram overlap detector:
- The engine segments the Job Description and mandatory skills into sequential 5-word phrases ($N=5$).
- It scans the candidate's resume for verbatim occurrences of these exact phrases:
  $$\text{Echo Ratio} = \left(\frac{\text{Matching N-Grams}}{\text{Total Job N-Grams}}\right) \times 100$$
- **Threshold Rules:**
  - **$\ge 35\%$ Echo Ratio:** Flagged as *High JD Verbatim Echo*. Authenticity Score capped at **45%** (*High AI / Manipulation Risk*).
  - **$20\% - 34\%$ Echo Ratio:** Flagged as *Moderate JD Phrasing Overlap*. Authenticity Score capped at **68%** (*Suspected AI Tailoring*).

### C. Career Timeline Chronology Validation
- Mathematical timeline consistency scanner compares graduation year, individual job tenures, and total claimed experience.
- Flags chronological anomalies (e.g., graduating in 2023 with 8 years of post-degree experience, or overlapping full-time engagements across different employers).

### D. Authenticity Badges & Recruiter Visibility
Every evaluated candidate receives an **Authenticity Score (0–100%)** and a status badge displayed on:
- Candidate Overview Cards (`🛡️ Verified Clean`, `⚠️ Suspected AI Tailoring`, `🚨 High AI Risk`).
- Expanded Candidate Audit Drawer (listing exact injection attempts and echo percentages).
- Candidate Comparison Matrix (dedicated row).
- Downloadable Recruiter CSV Reports.

---

## 6. Head-to-Head Candidate Comparison Matrix

When selecting the final candidate for an offer, recruiters use the **Comparison Matrix (Step 4)** to conduct side-by-side reviews:

### Core Capabilities:
1. **Two-Dimensional Frozen Grid Navigation:**
   - **Sticky Candidate Header (Top Row):** Remains pinned during vertical scrolling through deep technical matrices.
   - **Sticky Metric Column (Left Column):** Remains pinned during horizontal scrolling across 2 to 5 candidate profiles.
2. **Automated Mathematical Score Delta Justification:**
   - Computes clear, mathematical differences relative to the **#1 Ranked Candidate**:
     - *Must-Have Difference:* e.g., `+2 Mandatory Skills Matched`
     - *Technical Margin:* e.g., `+4% Margin in Technical Execution`
     - *Tenure Comparison:* Displays verified years side-by-side.
3. **"Ask Claude to Compare" Executive Memo:**
   - Dispatches candidate dossiers to Anthropic Claude to generate a 4-part comparative executive briefing:
     1. **Executive Headline Verdict:** Decisive hiring summary.
     2. **Winner Deep-Dive Analysis:** The exact competitive edge of the top candidate.
     3. **Key Differentiating Factors:** Real-world execution tradeoffs.
     4. **Recruiter Hiring Advice:** Concrete next steps (interview, offer, or hold).

---

## 7. Autonomous AI Video Interview, Vision Proctoring & Anti-Teleprompter Detection

CogniHire provides a browser-native technical video interview module that conducts proctored candidate interviews without requiring downloads or plugins.

### A. Candidate-Centric 30-Minute Self-Paced Global Timer
- Unlike conventional platforms that enforce high-stress 3-minute timers per question, CogniHire allocates a **30-minute global countdown** across the full 5-question interview.
- Candidates manage their time naturally across conceptual explanations and code walkthroughs, ensuring thoughtful, thorough answers without artificial panic.

### B. Dynamic Contextual Probing
- Powered by Anthropic Claude, the AI interviewer:
  - Generates bespoke technical questions targeting the candidate's actual projects.
  - Listens to candidate responses and asks dynamic, contextual follow-ups to probe for genuine hands-on experience.

### C. Client-Side Computer Vision Proctoring (Google MediaPipe)
Using MediaPipe WebAssembly FaceLandmarker at 30+ FPS, the browser tracks integrity in real time:
| Telemetry Signal | Detection Mechanism | Security Action |
| :--- | :--- | :--- |
| **Face Orientation & Gaze Offset** | 468-point 3D facial mesh computes iris position relative to nose (`irisX - noseX`). | Flags looking away or reading from secondary off-screen monitors. |
| **Face Absence Detection** | Landmark confidence falls below threshold. | Flags candidate leaving desk during active interview. |
| **Multiple Persons Detected** | Multi-face detection pipeline identifies secondary faces in frame. | Flags unauthorized in-person coaching or collaboration. |
| **Tab & Window Focus Loss** | Browser `window.blur` and `document.visibilityState` listeners. | Records unauthorized tab switches or search engine queries. |
| **Clipboard Abuse** | DOM `onCopy` and `onPaste` event listeners. | Flags pasted external code or prompt responses. |

### D. Anti-Teleprompter & Smartphone Cheating Detection Engine
A major risk in remote interviews is candidates placing a smartphone directly in front of their laptop screen (within the camera frame) or in their lap, snapping photos of questions, and typing answers from ChatGPT:

1. **Typing Cadence & WPM Dynamics Analysis (`transcriptionSuspected`):**
   - *Genuine Human Formulation:* Variable typing speed (30–55 WPM) with natural cognitive thinking pauses and 5%–15% backspaces/edits.
   - *Smartphone Transcription:* Sustained mechanical typing bursts ($\ge 80\text{ WPM}$ on substantive answers $\ge 40\text{ words}$) with less than **3% backspaces/corrections**.
   - Flagged as `Unusual transcription typing detected: average speed was {WPM} WPM with almost zero conceptual corrections`.

2. **Sustained Downward Gaze Tracking ($>3.5\text{s}$):**
   - Natural 1–2s keyboard glances are permitted without penalty.
   - Sustained downward gaze ($\ge 5\text{ consecutive frames}$, $\approx 3.5\text{s}$) even while typing triggers an integrity penalty for reading from an off-screen phone.

3. **Linguistic ChatGPT Stylometry Evaluator:**
   - Following interview completion, Anthropic Claude audits answers for AI writing signatures:
     - Conversational signposts (*"Certainly!", "In conclusion...", "It is important to note that..."*).
     - Rigid structural enumeration (*"Firstly... Secondly... Furthermore..."*).
     - Absence of conversational filler or spontaneous phrasing (*"well", "um", "in my experience"*).
   - Generates an **`aiContentProbability` (0–100%)** score, an **`answerAuthenticity`** rating (*Authentic Human Response*, *Suspected AI-Assisted*, or *High AI Content / Teleprompter Generated*), and itemizes detected AI signatures.

---

## 8. Multi-Tenant Corporate Management, Sender Identity & Email Routing

Enterprise recruitment requires strict separation of corporate client identities:
- **Client Company Profiles:** Dedicated company records storing Industry, Default Reply-to Email (`contactEmail`), Default Sender / Team Display Name (`senderName`), and Hiring Guidelines (`notes`).
- **In-Place Profile Editing:** Recruiters can update company profiles directly from:
  1. *Client Companies Management Tab* (top-right `[✏️ Edit]` button).
  2. *Step 1: Define Job Criteria* (`[✏️ Edit Company]` and `[+ New]` quick-action shortcuts beside the Target Client Company dropdown).
  3. *Top Connected Dropdown Toolbar* (quick-edit trigger when a company is active).
- **Outbound Email Routing:** Candidate invitations and interview notifications automatically route replies back to the client's verified hiring email (e.g., `careers@motherson.com`) with SPF/DKIM alignment to prevent spam filtering.

---

## 9. Cloud Infrastructure, Serverless Hosting & Zero-Data-Loss Architecture

### A. Serverless Google Cloud Run
- Deployed on Google Cloud Run in `asia-south1` (Mumbai).
- Serverless auto-scaling guarantees zero idle infrastructure costs during off-peak hours while scaling instantaneously to handle high-volume recruitment drives.

### B. Persistent Google Cloud Storage (GCS) FUSE Mount
To guarantee 100% data persistence across container restarts, code updates, and scale-to-zero cycles:
1. **Persistent Cloud Bucket:** Dedicated bucket `gs://cognihire-app-data` is mounted to `/app/data` via Cloud Storage FUSE.
2. **Local POSIX High-Speed Cache:** SQLite operates on `/tmp/sift.db` for instantaneous read/write execution (zero network lock latency).
3. **Atomic Synchronization (`syncToPersistentStorage`):**
   - Executes `PRAGMA wal_checkpoint(PASSIVE)` to flush pending database transactions.
   - Atomically copies `/tmp/sift.db` to `/app/data/sift.db` in Google Cloud Storage on every creation or modification.
4. **Automatic Cold-Boot Restoration:** When containers wake from sleep, they automatically inspect `gs://cognihire-app-data/sift.db` and restore all historical data before serving web traffic.

---

## 10. Enterprise Release Management, Semantic Versioning & In-App Changelog

CogniHire follows strict **Semantic Versioning 2.0 (`vMAJOR.MINOR.PATCH`)**:
- Current Production Release: **`v1.3.0`**.
- Backend System Telemetry Endpoint: **`GET /api/version`** returning version, build date, and git branch (`main`).

### In-App Version Visibility & What's New Changelog:
1. **Sidebar Navigation Footer:** Clickable badge `[ 🟢 CogniHire v1.3.0 Prod | What's New → ]` below the theme switcher.
2. **Dashboard Welcome Hero Banner:** Clickable badge `[ 🌿 v1.3.0 · What's New ]` next to the main title chip.
3. **Settings & AI Keys Tab:** Dedicated **"Platform Version Control & Releases"** panel showing release metadata and a `[ 📜 View Changelog ]` button.
4. **Interactive `ChangelogModal`:** Slide-in modal presenting the full release history:
   - **`v1.3.0` (Current Production):** Client company profile editing, Step 1 quick action shortcuts, toolbar decluttering.
   - **`v1.2.0` (Major Security Update):** Resume authenticity engine, N-gram JD echo detection, typing cadence / WPM dynamics detection, anti-teleprompter detection, ChatGPT stylometry audits.
   - **`v1.1.0` (Feature Release):** Head-to-head candidate comparison matrix, Claude automated executive comparison memos, synchronized two-dropdown toolbar.
   - **`v1.0.0` (Initial Release):** Multi-format parsing (PDF, DOCX, TXT), 4-pillar weighted scoring, MediaPipe Vision proctored video interviews.

---

## 11. Client FAQ & Enterprise Due Diligence Questionnaire

### Q1: Is candidate resume data private and GDPR / SOC2 compliant?
**Answer:** Yes. Resumes and evaluation reports are stored strictly in your dedicated, encrypted Google Cloud Storage bucket (`gs://cognihire-app-data`). Candidate data is never shared with third parties or used to train public AI models.

### Q2: How does CogniHire prevent candidates from tricking the system with AI resumes?
**Answer:** CogniHire deploys a dual-tier defense: (1) adversarial prompt injection sanitization strips hidden override instructions; (2) 5-word N-Gram echo analysis flags resumes that verbatim copy the job description. Suspicious resumes are tagged with visible authenticity warnings and score penalties.

### Q3: What prevents candidates from using ChatGPT or smartphones during the video interview?
**Answer:** The system tracks MediaPipe computer vision metrics (eye gaze, head orientation, face presence, tab switching) combined with typing cadence analysis. Candidates typing at $>80\text{ WPM}$ with $<3\%$ backspaces are flagged for smartphone transcription, and completed answers are audited for ChatGPT linguistic stylometry.

### Q4: What happens to our data during server restarts or updates?
**Answer:** Zero data loss. All SQLite database transactions are checkpointed and synchronized to persistent Google Cloud Storage via FUSE. New containers restore historical state automatically upon startup.

### Q5: What hardware or software is required for candidates?
**Answer:** No software downloads or extensions are required. Candidates only need a standard modern web browser (Chrome, Edge, Safari, Firefox) with camera and microphone permissions enabled.

---

*End of Technical Architecture Document. CogniHire Enterprise Talent Acquisition Platform.*
