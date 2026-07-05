# CLAUDE.md

Context for working on this project with Claude Code.

## What this is

SIFT is a full-stack web app that screens resumes against a job description
using the Claude API. A React (Vite) frontend collects a job definition and
resumes; an Express backend proxies each screening request to the Claude API.

## Architecture

- **Frontend** (`client/`) — Vite + React, single-page wizard with three steps
  (define role → add candidates → review shortlist). It orchestrates screening
  by calling the backend once per resume, with a concurrency limit of 3.
- **Backend** (`server/`) — Express. One real endpoint: `POST /api/analyze`,
  which takes `{ job, resume }` and returns a structured evaluation. The
  Anthropic API key lives only here, loaded from `.env`.
- The frontend talks to the backend at `/api`; in dev, Vite proxies that to
  `http://localhost:8787` (see `vite.config.js`).

## Key files

- `server/analyze.js` — prompt construction, the Claude API call, and JSON
  parsing. The output JSON schema is defined here; the whole UI depends on it.
- `server/index.js` — Express setup, the `/api/analyze` route, and static
  serving of the built frontend in production.
- `client/src/App.jsx` — the entire UI and screening orchestration.
- `client/src/api.js` — the frontend's call to `/api/analyze` and file→base64.

## Conventions

- ES modules throughout (`"type": "module"`).
- Frontend styling is inline-style objects driven by the `C` (colors) and
  `REC` (recommendation styling) constants at the top of `App.jsx`. Fonts and
  keyframes are in `client/src/index.css`.
- If you change the JSON schema in `server/analyze.js`, update the components
  in `App.jsx` that read those fields (`CandidateCard`, `Results`).

## Running

- `npm install` once.
- `npm run dev` runs backend and frontend together.
- Requires `.env` with `ANTHROPIC_API_KEY` (see `.env.example`).
- The Claude model is `MODEL` in `.env`, default `claude-sonnet-4-6`.

## Notes

- The backend is stateless — no database. Screenings are not persisted.
- PDFs are sent to the model as document blocks; DOCX is extracted to text
  with `mammoth`; plain text is passed directly.
