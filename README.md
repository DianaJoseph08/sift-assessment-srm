# SIFT — Resume Shortlisting & Recommendation Agent

An AI-powered web app that screens resumes against a job description, scores
candidate fit, ranks the pool, and recommends a shortlist — with interview
questions tailored to each candidate.

It is a full-stack project: a React (Vite) frontend and an Express backend.
The backend holds your Anthropic API key and proxies every screening request
to the Claude API, so the key is never exposed to the browser.

---

## What it does (the pipeline)

1. **Define the role** — job title, seniority, minimum experience, description,
   and must-have / nice-to-have skills.
2. **Add candidates** — upload resumes (PDF, DOCX, TXT) or paste text.
3. **AI screening** — for each resume, the agent extracts a structured profile
   and scores fit (overall + skills / experience / education / domain).
4. **Rank & shortlist** — a ranked chart, an adjustable shortlist cutoff,
   and per-candidate detail (strengths, gaps, missing must-haves, interview
   questions, sub-score radar).
5. **Export** — download the shortlist as CSV.

---

## Prerequisites

- **Node.js 20 or newer** (`node --version` to check)
- An **Anthropic API key** — create one at https://console.anthropic.com/
  under *Settings → API Keys*

---

## Setup

```bash
# 1. Install dependencies (frontend + backend share one package.json)
npm install

# 2. Create your .env file and add your key
cp .env.example .env
#   then edit .env and set ANTHROPIC_API_KEY=sk-ant-...

# 3. Start both the backend and the frontend (dev mode)
npm run dev
```

Then open **http://localhost:5173** in your browser.

In the app: click *Load sample role*, then *Load 4 sample resumes*, then
*Run AI screening* to see it work end to end.

---

## Available scripts

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `npm run dev`      | Runs backend (`:8787`) and frontend (`:5173`) together     |
| `npm run build`    | Builds the frontend into `dist/`                           |
| `npm start`        | Production: serves the built frontend from the backend     |
| `npm run dev:server` | Backend only                                             |
| `npm run dev:client` | Frontend only                                            |

**Production run:** `npm run build && npm start`, then open
http://localhost:8787 (the backend serves the built frontend).

---

## Project structure

```
sift-resume-agent/
├── server/
│   ├── index.js        Express server + /api/analyze route
│   └── analyze.js      Prompt construction + Claude API call + JSON parsing
├── client/
│   ├── index.html
│   └── src/
│       ├── main.jsx    React entry point
│       ├── App.jsx     Full UI: wizard, screening orchestration, results
│       ├── api.js      Calls the backend /api/analyze endpoint
│       └── index.css   Fonts, keyframes, base styles
├── vite.config.js      Frontend config + dev proxy to the backend
├── .env.example        Template for ANTHROPIC_API_KEY
├── CLAUDE.md           Context for working on this project in Claude Code
└── package.json
```

---

## How the AI agent works

The "agent" is a structured-output call to the Claude API, one per resume:

- `server/analyze.js` builds a prompt containing the job spec and the resume.
  PDFs are passed to the model as a document block; DOCX is converted to text
  with `mammoth`; plain text is used directly.
- The model is instructed to return **only JSON** matching a fixed schema
  (scores, recommendation, strengths, gaps, interview questions, etc.).
- The frontend runs candidates through a concurrency-limited pool (3 at a time)
  and updates the UI as each result arrives.

The model defaults to `claude-sonnet-4-6`; override it with the `MODEL`
variable in `.env`.

---

## Troubleshooting

- **"ANTHROPIC_API_KEY is not set"** — create `.env` from `.env.example` and add
  your key, then restart `npm run dev`.
- **Screening fails for every candidate** — check the backend terminal for the
  error. A 401 means the key is invalid; a 429 means you hit a rate limit.
- **Port already in use** — change `PORT` in `.env` (and the proxy target in
  `vite.config.js` if you change the backend port).
- **DOCX won't parse** — only `.docx` is supported, not the older `.doc`.

---

## Ideas to extend (good Claude Code tasks)

- Bias mitigation: strip names / gender cues before scoring.
- Batch upload of a whole folder of resumes.
- Persist screenings to a database (SQLite / Postgres).
- A vector pre-filter so the LLM only scores plausible candidates.
- Compare two candidates side by side.
