import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import Papa from "papaparse";
import {
  Upload, FileText, Briefcase, Sparkles, ChevronDown, ChevronRight, X, Check,
  Plus, Download, RotateCcw, ArrowRight, ArrowLeft, AlertCircle, Users, Star,
  Target, GraduationCap, Lightbulb, Search, Loader2, FileWarning, Trash2, Home,
  Mail, MessageSquare, Play,
} from "lucide-react";
import { analyzeCandidate, fileToBase64, sendInterviewChat, evaluateInterview } from "./api.js";

/* ============================== THEME ============================== */
const C = {
  bg: "#F8FAFC",
  paper: "#FFFFFF",
  panel: "#FFFFFF",
  ink: "#0F172A",
  sub: "#475569",
  faint: "#94A3B8",
  line: "#E2E8F0",
  lineSoft: "#F1F5F9",
  lineDark: "#CBD5E1",
  accent: "#034DA1",
  accentDeep: "#023570",
  accentSoft: "#EBF3FC",
};
const REC = {
  "Strong Match":   { fg: "#15803D", bg: "#DCFCE7", dot: "#16A34A" },
  "Good Match":     { fg: "#0369A1", bg: "#E0F2FE", dot: "#0284C7" },
  "Possible Match": { fg: "#B45309", bg: "#FEF3C7", dot: "#D97706" },
  "Weak Match":     { fg: "#B91C1C", bg: "#FEE2E2", dot: "#DC2626" },
};
const recMeta = (r) => REC[r] || REC["Possible Match"];
const gradeColor = (v) =>
  v >= 75 ? "#16A34A" : v >= 55 ? "#0284C7" : v >= 40 ? "#D97706" : "#DC2626";

const DISPLAY = "'Cambria Math', 'Cambria', Georgia, serif";
const BODY = "'Cambria Math', 'Cambria', Georgia, serif";

const SrmLogo = () => (
  <svg width="220" height="78" viewBox="0 0 450 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Top Banner */}
    <rect x="0" y="0" width="450" height="35" rx="6" fill="#034DA1" />
    <rect x="3" y="3" width="444" height="29" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
    <text x="225" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontFamily="'Cambria Math', 'Cambria', Georgia, serif" fontWeight="bold" letterSpacing="3">CHENNAI RAMAPURAM</text>
    
    {/* Left Crest */}
    <circle cx="70" cy="102" r="42" fill="#034DA1" />
    <circle cx="70" cy="102" r="42" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
    <circle cx="70" cy="102" r="39.5" fill="none" stroke="#D4AF37" strokeWidth="1.5" strokeDasharray="3 2" />
    <circle cx="70" cy="102" r="32" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" />
    <circle cx="70" cy="102" r="23" fill="#034DA1" />
    
    {/* Stylized Banyan Tree */}
    <path d="M68,118 L68,110 Q68,104 64,102 Q68,104 72,102 Q72,110 72,118 Z" fill="#FFFFFF" />
    <path d="M53,102 C51,99 52,94 56,93 C55,89 59,85 63,87 C66,83 72,83 75,86 C79,84 83,87 83,91 C87,92 88,97 85,100 C87,104 84,108 80,107 C78,111 72,111 70,108 C67,111 62,111 59,108 C55,108 53,105 53,102 Z" fill="#FFFFFF" />
    <path d="M64,118 Q67,117 68,116 M72,116 Q73,117 76,118 M69,117 L69,121 M71,117 L71,121" stroke="#FFFFFF" strokeWidth="1" fill="none" />
    
    {/* Circular Text */}
    <path id="crestTextPath" d="M 42.5,102 A 27.5,27.5 0 0,1 97.5,102" fill="none" />
    <text fontSize="3.8" fontFamily="'Cambria Math', 'Cambria', Georgia, serif" fontWeight="bold" fill="#034DA1">
      <textPath href="#crestTextPath" startOffset="50%" textAnchor="middle">
        SRM INSTITUTE OF SCIENCE &amp; TECHNOLOGY
      </textPath>
    </text>
    
    {/* Ribbon Banner at bottom */}
    <path d="M 43,124 Q 70,121 97,124 L 95,130 Q 70,127 45,130 Z" fill="#FFFFFF" stroke="#034DA1" strokeWidth="0.8" />
    <path d="M 43,124 L 38,127 L 45,130 M 97,124 L 102,127 L 95,130" fill="none" stroke="#034DA1" strokeWidth="0.8" />
    <text x="70" y="127.5" textAnchor="middle" fill="#034DA1" fontSize="4.2" fontWeight="bold" fontFamily="'Cambria Math', 'Cambria', Georgia, serif">LEARN • LEAP • LEAD</text>
    
    {/* Right Typography */}
    <text x="135" y="106" fill="#034DA1" fontSize="72" fontFamily="'Cambria Math', 'Cambria', Georgia, serif" fontWeight="bold" letterSpacing="-1">SRM</text>
    <text x="135" y="128" fill="#1E293B" fontSize="17.2" fontFamily="'Cambria Math', 'Cambria', Georgia, serif" fontWeight="bold" letterSpacing="0.1">INSTITUTE OF SCIENCE &amp; TECHNOLOGY</text>
    <text x="135" y="145" fill="#475569" fontSize="13" fontFamily="'Cambria Math', 'Cambria', Georgia, serif" fontStyle="italic" fontWeight="bold">(Deemed to be University u/s 3 of UGC Act, 1956)</text>
  </svg>
);

/* ============================== SAMPLE DATA ============================== */
const SAMPLE_JOB = {
  title: "Senior Machine Learning Engineer",
  seniority: "Senior",
  minYears: 5,
  location: "Bengaluru / Hybrid",
  description:
    "We are hiring a Senior Machine Learning Engineer to design, build, and deploy production ML systems. You will own models end to end — from data pipelines and experimentation to deployment, monitoring, and iteration. You will collaborate with product and data teams to ship recommendation and prediction features at scale. Strong software engineering fundamentals and proven experience taking models to production are essential.",
  mustHave: ["Python", "PyTorch or TensorFlow", "Machine Learning", "Model Deployment / MLOps", "SQL"],
  niceToHave: ["Kubernetes", "Recommendation Systems", "AWS or GCP", "Spark"],
};
const SAMPLE_RESUMES = [
  { label: "Priya Nair — resume.txt", text:
`Priya Nair — Senior Machine Learning Engineer. 7 years building ML systems.
Experience: ML Engineer at FlipMart (2019-present) — built and deployed product recommendation models in PyTorch serving 20M users; cut inference latency by 40%; owned the MLOps pipeline with Docker, Kubernetes, MLflow and Airflow. Data Scientist at Zentra (2017-2019) — churn prediction models, A/B testing.
Skills: Python, PyTorch, TensorFlow, SQL, Spark, AWS SageMaker, Kubernetes, Airflow.
Education: M.Tech Computer Science, IIT Madras.
Projects: Real-time ranking service; open-source contributor to a feature store.` },
  { label: "Arjun Rao — resume.txt", text:
`Arjun Rao — Data Scientist, 5 years experience.
Experience: Data Scientist at Nova Analytics (2020-present) — built forecasting and classification models with scikit-learn and XGBoost; deployed two models to production via Flask APIs; wrote SQL for data extraction. Analyst at DataCrest (2019-2020).
Skills: Python, scikit-learn, XGBoost, Pandas, SQL, basic Docker, some TensorFlow.
Education: M.Sc Statistics, University of Hyderabad.
Keen to move into a deeper ML engineering role.` },
  { label: "Meera Iyer — resume.txt", text:
`Meera Iyer — Software Engineer, 3 years experience.
Experience: Backend Engineer at PayGrid (2021-present) — Python and Django REST services, PostgreSQL, AWS Lambda; built CI/CD pipelines.
Side projects: an image classifier built with PyTorch; a small movie recommendation demo published on Kaggle.
Skills: Python, Django, SQL, AWS, Git; currently learning PyTorch.
Education: B.E Information Technology, Anna University.` },
  { label: "Karan Mehta — resume.txt", text:
`Karan Mehta — Senior Frontend Engineer, 8 years experience.
Experience: Lead Frontend Engineer at BrightApps (2018-present) — React, TypeScript, design systems; led a team of 6. Frontend Developer at WebWorks (2016-2018).
Skills: JavaScript, TypeScript, React, CSS, HTML, Figma, Node.js.
Education: B.Tech Electronics, VIT.
Interests: UI performance and accessibility.` },
];

/* ============================== HELPERS ============================== */
let _id = 0;
const uid = () => `c${++_id}_${Date.now()}`;

/** Concurrency-limited task runner. */
async function runPool(items, limit, worker) {
  let i = 0;
  const next = async () => {
    while (i < items.length) {
      const cur = i++;
      await worker(items[cur], cur);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
}

function downloadCSV(rows, filename) {
  const blob = new Blob([Papa.unparse(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================== UI PRIMITIVES ============================== */
const btn = (variant) => {
  const base = {
    fontFamily: BODY, fontSize: 14, fontWeight: 600, cursor: "pointer",
    borderRadius: 9, padding: "11px 18px", display: "inline-flex",
    alignItems: "center", gap: 8, transition: "all .15s", border: "1px solid transparent",
  };
  if (variant === "primary") return { ...base, background: C.accent, color: "#FFF8F2" };
  if (variant === "ghost") return { ...base, background: "transparent", color: C.sub, border: `1px solid ${C.line}` };
  if (variant === "soft") return { ...base, background: C.accentSoft, color: C.accentDeep };
  return base;
};

const inputStyle = {
  width: "100%", fontFamily: BODY, fontSize: 14, color: C.ink, background: C.panel,
  border: `1px solid ${C.line}`, borderRadius: 9, padding: "11px 13px", outline: "none", boxSizing: "border-box",
};

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: ".06em",
        textTransform: "uppercase", color: C.sub, marginBottom: 7 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: C.faint, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Panel({ title, sub, children }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14,
      padding: "20px 22px" }}>
      {title && (
        <h3 style={{ fontFamily: DISPLAY, fontSize: 18, fontWeight: 600, color: C.ink,
          margin: 0, marginBottom: sub ? 4 : 14 }}>{title}</h3>
      )}
      {sub && <div style={{ fontSize: 12.8, color: C.sub, marginBottom: 16 }}>{sub}</div>}
      {children}
    </div>
  );
}

function SkillEditor({ skills, onChange, placeholder }) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim();
    if (t && !skills.includes(t)) onChange([...skills, t]);
    setV("");
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={inputStyle} value={v} placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button style={{ ...btn("soft"), padding: "0 14px" }} onClick={add}><Plus size={16} /></button>
      </div>
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
          {skills.map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6,
              background: C.accentSoft, color: C.accentDeep, fontSize: 13, fontWeight: 600,
              padding: "5px 9px", borderRadius: 7 }}>
              {s}
              <X size={13} style={{ cursor: "pointer" }}
                onClick={() => onChange(skills.filter((x) => x !== s))} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Stepper({ step, maxReached, go }) {
  const steps = ["Define the Role", "Add Candidates", "Review Shortlist"];
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step && maxReached >= n;
        const reachable = n <= maxReached;
        return (
          <React.Fragment key={n}>
            <div
              onClick={() => reachable && go(n)}
              style={{ display: "flex", alignItems: "center", gap: 8,
                cursor: reachable ? "pointer" : "default", opacity: reachable ? 1 : 0.5 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                background: active ? C.accent : done ? C.accentSoft : C.panel,
                color: active ? "#FFF8F2" : done ? C.accentDeep : C.faint,
                border: `1px solid ${active ? C.accent : C.line}` }}>
                {done ? <Check size={14} /> : n}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? C.ink : C.sub }}>{label}</span>
            </div>
            {n < 3 && <div style={{ width: 26, height: 1, background: C.line }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{ flex: 1, minWidth: 150, background: C.panel, border: `1px solid ${C.line}`,
      borderRadius: 12, padding: "15px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, color: C.sub, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600,
        color: accent || C.ink, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function MiniBar({ label, value }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5,
        color: C.sub, marginBottom: 3 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontWeight: 700, color: C.ink }}>{Math.round(value)}</span>
      </div>
      <div style={{ height: 6, background: C.lineSoft, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%",
          background: gradeColor(value), borderRadius: 4 }} />
      </div>
    </div>
  );
}

const SubHead = ({ children, style }) => (
  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase",
    color: C.sub, ...style }}>{children}</div>
);
const List = ({ items, color, icon }) => (
  <ul style={{ listStyle: "none", margin: "5px 0 0", padding: 0 }}>
    {(items || []).map((t, i) => (
      <li key={i} style={{ display: "flex", gap: 7, fontSize: 12.8, color: C.ink,
        lineHeight: 1.5, marginBottom: 4 }}>
        <span style={{ color, flexShrink: 0, marginTop: 2 }}>{icon}</span>{t}
      </li>
    ))}
  </ul>
);

/* ============================== STEP 1: ROLE ============================== */
function RoleStep({ job, setJob, onNext }) {
  const ready = job.title.trim() && job.description.trim();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 22 }}>
      <Panel title="Role definition" sub="The agent screens every resume against exactly these criteria.">
        <Field label="Job title">
          <input style={inputStyle} value={job.title}
            placeholder="e.g. Senior Machine Learning Engineer"
            onChange={(e) => setJob({ ...job, title: e.target.value })} />
        </Field>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <Field label="Seniority">
              <select style={inputStyle} value={job.seniority}
                onChange={(e) => setJob({ ...job, seniority: e.target.value })}>
                {["Intern", "Junior", "Mid-level", "Senior", "Lead / Principal"].map((s) =>
                  <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ width: 120 }}>
            <Field label="Min. years">
              <input type="number" min={0} style={inputStyle} value={job.minYears}
                onChange={(e) => setJob({ ...job, minYears: Number(e.target.value) })} />
            </Field>
          </div>
        </div>
        <Field label="Location / work mode">
          <input style={inputStyle} value={job.location}
            placeholder="e.g. Chennai / Hybrid"
            onChange={(e) => setJob({ ...job, location: e.target.value })} />
        </Field>
        <Field label="Job description">
          <textarea style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.55 }}
            value={job.description}
            placeholder="Responsibilities, scope, and what success looks like…"
            onChange={(e) => setJob({ ...job, description: e.target.value })} />
        </Field>
      </Panel>

      <div>
        <Panel title="Skills criteria" sub="Must-haves carry the most weight in scoring.">
          <Field label="Must-have skills" hint="Press Enter or + to add each skill.">
            <SkillEditor skills={job.mustHave} placeholder="Add a required skill…"
              onChange={(v) => setJob({ ...job, mustHave: v })} />
          </Field>
          <Field label="Nice-to-have skills">
            <SkillEditor skills={job.niceToHave} placeholder="Add a bonus skill…"
              onChange={(v) => setJob({ ...job, niceToHave: v })} />
          </Field>
        </Panel>
        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
          <button style={btn("ghost")} onClick={() => setJob({ ...SAMPLE_JOB })}>
            <Sparkles size={15} /> Load sample role
          </button>
          <button style={{ ...btn("primary"), opacity: ready ? 1 : 0.45,
            cursor: ready ? "pointer" : "not-allowed", marginLeft: "auto" }}
            onClick={() => ready && onNext()}>
            Add candidates <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== STEP 2: CANDIDATES ============================== */
function CandidateStep({ candidates, setCandidates, onBack, onRun }) {
  const [drag, setDrag] = useState(false);
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const pasteCount = useRef(0);

  const unscreenedCount = candidates.filter((c) => c.status !== "done" || !c.result).length;
  const buttonText = unscreenedCount > 0 
    ? `Screen ${unscreenedCount} New Resume${unscreenedCount > 1 ? "s" : ""}` 
    : "View Results";

  const addFiles = async (files) => {
    setErr("");
    for (const f of Array.from(files)) {
      try {
        const base64 = await fileToBase64(f);
        setCandidates((cs) => [...cs, {
          id: uid(), kind: "file", filename: f.name, base64,
          fileSize: f.size, label: f.name, status: "idle", result: null, error: null,
        }]);
      } catch {
        setErr(`Could not read "${f.name}".`);
      }
    }
  };
  const addPaste = () => {
    if (!paste.trim()) return;
    pasteCount.current += 1;
    setCandidates((cs) => [...cs, {
      id: uid(), kind: "text", text: paste.trim(),
      label: `Pasted resume ${pasteCount.current}`, status: "idle", result: null, error: null,
    }]);
    setPaste("");
  };
  const loadSamples = () =>
    setCandidates(SAMPLE_RESUMES.map((r) => ({
      id: uid(), kind: "text", text: r.text, label: r.label,
      status: "idle", result: null, error: null,
    })));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
      <Panel title="Add resumes" sub="Upload files or paste resume text. PDF, DOCX and TXT are supported.">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `1.5px dashed ${drag ? C.accent : C.lineDark}`,
            background: drag ? C.accentSoft : C.paper, borderRadius: 12, padding: "30px 18px",
            textAlign: "center", cursor: "pointer", transition: "all .15s" }}>
          <Upload size={26} color={C.accent} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>Drop resumes here</div>
          <div style={{ fontSize: 12.5, color: C.faint, marginTop: 3 }}>or click to browse — multiple files OK</div>
          <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt" style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)} />
        </div>

        <div style={{ margin: "16px 0 7px", fontSize: 12, fontWeight: 700, letterSpacing: ".06em",
          textTransform: "uppercase", color: C.sub }}>Or paste resume text</div>
        <textarea style={{ ...inputStyle, minHeight: 92, resize: "vertical" }}
          value={paste} placeholder="Paste a single resume's text here…"
          onChange={(e) => setPaste(e.target.value)} />
        <div style={{ display: "flex", gap: 9, marginTop: 9 }}>
          <button style={btn("soft")} onClick={addPaste}><Plus size={15} /> Add resume</button>
          <button style={btn("ghost")} onClick={loadSamples}>
            <Sparkles size={15} /> Load 4 sample resumes
          </button>
        </div>
        {err && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: REC["Weak Match"].fg,
            display: "flex", gap: 6, alignItems: "center" }}>
            <FileWarning size={14} /> {err}
          </div>
        )}
      </Panel>

      <Panel title={`Candidate pool · ${candidates.length}`}
        sub="These resumes will be screened by the AI agent.">
        {candidates.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 13.5, padding: "30px 0", textAlign: "center" }}>
            No candidates yet. Add at least one resume to continue.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
            {candidates.map((c) => {
              const hasScore = c.status === "done" && c.result;
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10,
                  background: C.paper, border: `1px solid ${C.line}`, borderRadius: 9, padding: "10px 12px",
                  opacity: hasScore ? 0.85 : 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7,
                    background: hasScore ? C.lineSoft : C.accentSoft,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={15} color={hasScore ? C.sub : C.accentDeep} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: C.ink,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {hasScore ? (c.result.candidateName || c.label) : c.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11.5, color: C.faint }}>
                        {c.kind === "file"
                          ? (hasScore ? `${c.filename} (${(c.fileSize / 1024).toFixed(1)} KB)` : `${(c.fileSize / 1024).toFixed(1)} KB`)
                          : `${(c.text || "").length} chars`}
                      </span>
                      {hasScore && (
                        <>
                          <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.faint }} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: REC[c.result.recommendation]?.dot || C.sub }}>
                            Score: {c.result.overallScore} ({c.result.recommendation}) [Preserved]
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <X size={16} color={C.faint} style={{ cursor: "pointer" }}
                    onClick={() => setCandidates((cs) => cs.filter((x) => x.id !== c.id))} />
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10 }}>
        <button style={btn("ghost")} onClick={onBack}><ArrowLeft size={16} /> Back to role</button>
        <button style={{ ...btn("primary"), marginLeft: "auto",
          opacity: candidates.length ? 1 : 0.45, cursor: candidates.length ? "pointer" : "not-allowed" }}
          onClick={() => candidates.length && onRun()}>
          <Sparkles size={16} /> {buttonText}
        </button>
      </div>
    </div>
  );
}

/* ============================== STEP 3a: ANALYZING ============================== */
function Analyzing({ candidates }) {
  const done = candidates.filter((c) => c.status === "done" || c.status === "error").length;
  const pct = Math.round((done / Math.max(1, candidates.length)) * 100);
  return (
    <Panel title="The agent is screening candidates"
      sub="Each resume is read, parsed into a structured profile, then scored against your role.">
      <div style={{ height: 9, background: C.lineSoft, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: C.accent,
          borderRadius: 6, transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
        {done} of {candidates.length} resumes analysed
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {candidates.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", background: C.paper, border: `1px solid ${C.line}`, borderRadius: 9,
            opacity: c.status === "done" && c.result ? 0.75 : 1 }}>
            <span style={{ flex: 1, fontSize: 13.5, color: C.ink, fontWeight: 600 }}>
              {c.result?.candidateName || c.label}
            </span>
            {c.status === "done" && c.result && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5,
                fontWeight: 700, color: REC[c.result.recommendation]?.dot || C.sub }}>
                <Check size={14} /> Score: {c.result?.overallScore} (Preserved)
              </span>
            )}
            {c.status === "error" && (
              <span style={{ fontSize: 12.5, color: REC["Weak Match"].fg, fontWeight: 600 }}>Failed</span>
            )}
            {(c.status === "analyzing" || c.status === "queued") && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.faint }}>
                <Loader2 size={14} className="spin" />
                {c.status === "analyzing" ? "Analysing…" : "Queued"}
              </span>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ============================== STEP 3b: RESULTS ============================== */
function CandidateCard({ rank, c, threshold, jobTitle, onStartInterview }) {
  const [open, setOpen] = useState(false);
  const r = c.result;

  const inviteLink = `${window.location.origin}/?candidateId=${c.id}`;
  const emailSubject = `Technical Interview Invitation - ${jobTitle || "Job Role"}`;
  const emailBody = `Dear ${r?.candidateName || "Candidate"},\n\n` +
    `Thank you for applying for the ${jobTitle || "Job Role"} position at SRM Group of Institutions.\n\n` +
    `We have reviewed your resume and are pleased to inform you that you have been shortlisted for an interview! As the next step, please complete the interactive AI Technical Assessment at the link below. This is a proctored session and will require camera and microphone access.\n\n` +
    `Assessment Link: ${inviteLink}\n\n` +
    `Best regards,\n` +
    `Recruitment Team`;

  if (c.status === "error" || !r) {
    return (
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12,
        padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <AlertCircle size={17} color={REC["Weak Match"].fg} />
        <span style={{ fontWeight: 600, color: C.ink }}>{c.label}</span>
        <span style={{ fontSize: 12.5, color: C.faint, marginLeft: "auto" }}>
          {c.error || "Could not be analysed"} — try re-running.
        </span>
      </div>
    );
  }

  const m = recMeta(r.recommendation);
  const shortlisted = r.overallScore >= threshold;
  const radar = [
    { dim: "Skills", v: r.subScores?.skills ?? 0 },
    { dim: "Experience", v: r.subScores?.experience ?? 0 },
    { dim: "Education", v: r.subScores?.education ?? 0 },
    { dim: "Domain", v: r.subScores?.domain ?? 0 },
  ];

  return (
    <div style={{ background: C.panel, border: `1px solid ${shortlisted ? m.dot : C.line}`,
      borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 17px", cursor: "pointer" }}
        onClick={() => setOpen(!open)}>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: C.faint, width: 30 }}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{r.candidateName || c.label}</span>
            {shortlisted && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5,
                fontWeight: 800, letterSpacing: ".05em", color: C.accentDeep, background: C.accentSoft,
                padding: "3px 7px", borderRadius: 5 }}>
                <Star size={11} /> SHORTLISTED
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>{r.currentTitle} · {r.yearsExperience} yrs experience</span>
            {r.email && r.email !== "N/A" && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.faint }} />
                <span style={{ color: C.faint, fontStyle: "italic" }}>{r.email}</span>
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {r.interview && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: gradeColor(r.interview.score), lineHeight: 1 }}>
                {r.interview.score}%
              </div>
              <div style={{ fontSize: 9, color: C.faint, fontWeight: 700, letterSpacing: ".04em" }}>INTERVIEW</div>
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: m.dot, lineHeight: 1 }}>
              {r.overallScore}%
            </div>
            <div style={{ fontSize: 9, color: C.faint, fontWeight: 700, letterSpacing: ".04em" }}>RESUME FIT</div>
          </div>
        </div>

        <span style={{ fontSize: 11.5, fontWeight: 700, color: m.fg, background: m.bg,
          padding: "5px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>{r.recommendation}</span>
        {r.email && r.email !== "N/A" && (
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${r.email}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(r.email);
            }}
            title={`Email ${r.candidateName} (${r.email}) via Gmail`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: C.accentSoft,
              color: C.accentDeep,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
              flexShrink: 0,
              marginLeft: 8,
              marginRight: 4
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.accent;
              e.currentTarget.style.color = "#FFF8F2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = C.accentSoft;
              e.currentTarget.style.color = C.accentDeep;
            }}
          >
            <Mail size={15} />
          </a>
        )}
        {open ? <ChevronDown size={18} color={C.faint} /> : <ChevronRight size={18} color={C.faint} />}
      </div>

      <div style={{ padding: "0 17px 13px", fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
        {r.summary}
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.lineSoft}`, padding: "16px 17px",
          background: C.paper, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
          <div>
            <SubHead>Strengths</SubHead>
            <List items={r.strengths} color={REC["Strong Match"].dot} icon={<Check size={13} />} />
            <SubHead style={{ marginTop: 14 }}>Gaps &amp; risks</SubHead>
            <List items={r.gaps} color={REC["Possible Match"].dot} icon={<AlertCircle size={13} />} />
            {r.missingMustHaves?.length > 0 && (
              <div style={{ marginTop: 12, background: REC["Weak Match"].bg, borderRadius: 8,
                padding: "9px 11px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: REC["Weak Match"].fg,
                  letterSpacing: ".04em" }}>MISSING MUST-HAVES</div>
                <div style={{ fontSize: 12.5, color: REC["Weak Match"].fg, marginTop: 3 }}>
                  {r.missingMustHaves.join(", ")}
                </div>
              </div>
            )}
            <SubHead style={{ marginTop: 14 }}>
              <Lightbulb size={13} style={{ verticalAlign: -2 }} /> Suggested interview questions
            </SubHead>
            <ol style={{ margin: "4px 0 0", paddingLeft: 18, color: C.ink, fontSize: 12.8, lineHeight: 1.6 }}>
               {(r.interviewQuestions || []).map((q, i) => <li key={i} style={{ marginBottom: 3 }}>{q}</li>)}
            </ol>
            {r.interviewFocus && (
              <div style={{ fontSize: 12.3, color: C.sub, marginTop: 8, fontStyle: "italic" }}>
                Focus: {r.interviewFocus}
              </div>
            )}
          </div>
          <div>
            <SubHead>Fit breakdown</SubHead>
            <div style={{ marginTop: 6 }}>
              <MiniBar label="Skills" value={r.subScores?.skills ?? 0} />
              <MiniBar label="Experience" value={r.subScores?.experience ?? 0} />
              <MiniBar label="Education" value={r.subScores?.education ?? 0} />
              <MiniBar label="Domain fit" value={r.subScores?.domain ?? 0} />
            </div>
            <div style={{ height: 168, marginTop: 6 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius={62}>
                  <PolarGrid stroke={C.line} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10.5, fill: C.sub }} />
                  <Radar dataKey="v" stroke={m.dot} fill={m.dot} fillOpacity={0.28} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <SubHead style={{ marginTop: 6 }}>
              <GraduationCap size={13} style={{ verticalAlign: -2 }} /> Education
            </SubHead>
            <div style={{ fontSize: 12.5, color: C.ink, marginTop: 3 }}>{r.education}</div>
            
            <SubHead style={{ marginTop: 10 }}>
              <Mail size={13} style={{ verticalAlign: -2 }} /> Contact Email
            </SubHead>
            <div style={{ fontSize: 12.5, color: C.ink, marginTop: 3, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 600 }}>{r.email || "N/A"}</span>
              {r.email && r.email !== "N/A" && (
                <div style={{ display: "inline-flex", gap: 6 }}>
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${r.email}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(r.email);
                    }}
                    style={{
                      color: C.accentDeep,
                      background: C.accentSoft,
                      padding: "2px 8px",
                      borderRadius: 6,
                      textDecoration: "none",
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: `1px solid ${C.accentSoft}`
                    }}
                  >
                    Open in Gmail
                  </a>
                  <a
                    href={`mailto:${r.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(r.email);
                    }}
                    style={{
                      color: C.sub,
                      background: C.lineSoft,
                      padding: "2px 8px",
                      borderRadius: 6,
                      textDecoration: "none",
                      fontSize: 11.5,
                      fontWeight: 700,
                      border: `1px solid ${C.line}`
                    }}
                  >
                    Mail App (Outlook)
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(inviteLink);
                      alert("Candidate invitation link copied to clipboard!");
                    }}
                    style={{
                      color: C.accentDeep,
                      background: C.accentSoft,
                      padding: "2px 8px",
                      borderRadius: 6,
                      border: `1px solid ${C.accent}30`,
                      cursor: "pointer",
                      fontSize: 11.5,
                      fontWeight: 700,
                      outline: "none"
                    }}
                  >
                    Copy Invite Link
                  </button>
                </div>
              )}
            </div>

            {r.topSkills?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
                {r.topSkills.map((s) => (
                  <span key={s} style={{ fontSize: 11, fontWeight: 600, color: C.sub,
                    background: C.lineSoft, padding: "3px 7px", borderRadius: 5 }}>{s}</span>
                ))}
              </div>
            )}

            {/* AI Technical Interview Integration Panel */}
            <div style={{
              marginTop: 18, padding: "14px 16px", borderRadius: 10,
              background: C.accentSoft, border: `1px solid ${C.accent}20`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <MessageSquare size={15} color={C.accentDeep} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: C.accentDeep, letterSpacing: ".04em" }}>
                  AI TECHNICAL INTERVIEW
                </span>
              </div>
              
              {r.interview ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12.8, color: C.ink, fontWeight: 600 }}>Assessor Score:</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: gradeColor(r.interview.score) }}>
                      {r.interview.score}%
                    </span>
                  </div>

                  {r.interview.proctoring && (
                    <div style={{
                      background: C.paper, padding: "8px 10px", borderRadius: 8,
                      border: `1px solid ${C.lineSoft}`, marginBottom: 10, fontSize: 11.5
                    }}>
                      <div style={{ fontWeight: 700, color: C.faint, marginBottom: 5, fontSize: 9.5, letterSpacing: ".04em" }}>
                        PROCTORING AUDIT LOG
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: C.sub }}>Webcam Verification:</span>
                        <span style={{ fontWeight: 700, color: r.interview.proctoring.mediaAccess ? "#16A34A" : REC["Weak Match"].dot }}>
                          {r.interview.proctoring.mediaAccess ? "✔ Active" : "✖ Denied"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: C.sub }}>Tab Switches:</span>
                        <span style={{
                          fontWeight: 700,
                          color: r.interview.proctoring.tabSwitches > 0 ? REC["Weak Match"].dot : "#16A34A"
                        }}>
                          {r.interview.proctoring.tabSwitches > 0 ? `${r.interview.proctoring.tabSwitches} switches (Warning)` : "✔ 0 switches"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                        <span style={{ color: C.sub }}>Copy-Paste Actions:</span>
                        <span style={{
                          fontWeight: 700,
                          color: (r.interview.proctoring.pasteCount || 0) > 0 ? REC["Weak Match"].dot : "#16A34A"
                        }}>
                          {(r.interview.proctoring.pasteCount || 0) > 0 ? `${r.interview.proctoring.pasteCount} paste actions (Warning)` : "✔ 0 pastes"}
                        </span>
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 10px 0", lineHeight: 1.45 }}>
                    {r.interview.summary}
                  </p>
                  
                  {/* Collapsible Transcript */}
                  <details style={{ cursor: "pointer", fontSize: 12 }}>
                    <summary style={{ fontWeight: 600, color: C.accentDeep, outline: "none", marginBottom: 6 }}>
                      View Transcript ({r.interview.transcript?.length || 0} messages)
                    </summary>
                    <div style={{
                      maxHeight: 150, overflowY: "auto", padding: "8px 10px",
                      background: C.paper, borderRadius: 6, border: `1px solid ${C.lineSoft}`,
                      display: "flex", flexDirection: "column", gap: 6, marginTop: 4
                    }}>
                      {(r.interview.transcript || []).map((m, idx) => (
                        <div key={idx} style={{ fontSize: 11.5, lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 700, color: m.role === "interviewer" ? C.accent : C.ink }}>
                            {m.role === "interviewer" ? "AI" : (r.candidateName || "Candidate")}:
                          </span>{" "}
                          <span style={{ color: C.sub }}>{m.content}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                  
                  <button
                    style={{ ...btn("ghost"), width: "100%", padding: "6px 10px", fontSize: 12, marginTop: 12, justifyContent: "center" }}
                    onClick={(e) => { e.stopPropagation(); onStartInterview(c); }}
                  >
                    Re-take Technical Interview
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12.5, color: C.sub, margin: "0 0 10px 0", lineHeight: 1.4 }}>
                    Assess candidate's technical skills dynamically in an interactive virtual interview room.
                  </p>
                  <button
                    style={{ ...btn("primary"), width: "100%", padding: "8px 10px", fontSize: 12, justifyContent: "center" }}
                    onClick={(e) => { e.stopPropagation(); onStartInterview(c); }}
                  >
                    <Play size={12} fill="currentColor" style={{ verticalAlign: -1 }} /> Start AI Interview
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Results({ candidates, job, onReRun, onRestart, onStartInterview }) {
  const [threshold, setThreshold] = useState(70);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("score");

  const scored = candidates.filter((c) => c.status === "done" && c.result);
  const failed = candidates.filter((c) => c.status === "error");

  const ranked = useMemo(() => {
    const list = [...scored];
    list.sort((a, b) =>
      sort === "score"
        ? b.result.overallScore - a.result.overallScore
        : (a.result.candidateName || "").localeCompare(b.result.candidateName || ""));
    return list;
  }, [scored, sort]);

  const shortlisted = scored.filter((c) => c.result.overallScore >= threshold);
  const avg = scored.length
    ? Math.round(scored.reduce((s, c) => s + c.result.overallScore, 0) / scored.length) : 0;
  const top = [...scored].sort((a, b) => b.result.overallScore - a.result.overallScore)[0];

  const visible = filter === "shortlist"
    ? ranked.filter((c) => c.result.overallScore >= threshold) : ranked;

  const chartData = [...ranked].reverse().map((c) => ({
    name: (c.result.candidateName || "").trim().split(" ")[0] || c.label.slice(0, 10),
    score: c.result.overallScore,
    fill: recMeta(c.result.recommendation).dot,
  }));

  const exportCSV = () => {
    const rows = ranked.map((c, i) => {
      const r = c.result;
      return {
        Rank: i + 1, Name: r.candidateName || c.label, Email: r.email || "N/A", Title: r.currentTitle, Years: r.yearsExperience,
        "Overall Score": r.overallScore, Skills: r.subScores?.skills, Experience: r.subScores?.experience,
        Education: r.subScores?.education, Domain: r.subScores?.domain,
        Recommendation: r.recommendation,
        Shortlisted: r.overallScore >= threshold ? "Yes" : "No",
        "Missing Must-Haves": (r.missingMustHaves || []).join("; "),
        Summary: r.summary,
      };
    });
    downloadCSV(rows, `shortlist_${(job.title || "role").replace(/\s+/g, "_").toLowerCase()}.csv`);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard icon={<Users size={14} />} label="Screened" value={scored.length} />
        <StatCard icon={<Star size={14} />} label="Shortlisted" value={shortlisted.length} accent={C.accent} />
        <StatCard icon={<Target size={14} />} label="Average fit" value={avg} />
        <StatCard icon={<Briefcase size={14} />} label="Top candidate"
          value={top ? (top.result.candidateName || "").split(" ")[0] : "—"} />
      </div>

      {scored.length > 0 && (
        <Panel title="Fit ranking" sub="All screened candidates, scored 0–100 against your role.">
          <div style={{ height: Math.max(150, chartData.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 26, top: 4, bottom: 4 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: C.faint }}
                  axisLine={{ stroke: C.line }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={78}
                  tick={{ fontSize: 12, fill: C.ink }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: C.lineSoft }}
                  contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, fontSize: 12, fontFamily: BODY }} />
                <Bar dataKey="score" radius={[0, 5, 5, 0]} barSize={20}>
                  {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "18px 0 12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub }}>Shortlist cutoff</span>
          <input type="range" min={40} max={90} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            style={{ accentColor: C.accent, width: 130 }} />
          <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, color: C.accent }}>{threshold}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {[["all", "All"], ["shortlist", "Shortlisted only"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ ...btn(filter === k ? "soft" : "ghost"), padding: "7px 12px", fontSize: 12.5 }}>
              {l}
            </button>
          ))}
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            style={{ ...inputStyle, width: "auto", padding: "7px 10px", fontSize: 12.5 }}>
            <option value="score">Sort: by score</option>
            <option value="name">Sort: by name</option>
          </select>
          <button style={{ ...btn("ghost"), padding: "7px 12px", fontSize: 12.5 }} onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((c, i) => (
          <div key={c.id} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CandidateCard rank={ranked.indexOf(c) + 1} c={c} threshold={threshold} jobTitle={job.title} onStartInterview={onStartInterview} />
          </div>
        ))}
        {failed.map((c) => <CandidateCard key={c.id} rank={"—"} c={c} threshold={threshold} jobTitle={job.title} onStartInterview={onStartInterview} />)}
        {visible.length === 0 && (
          <div style={{ color: C.faint, fontSize: 13.5, textAlign: "center", padding: 24 }}>
            No candidates above the cutoff. Lower the shortlist cutoff to see more.
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button style={btn("ghost")} onClick={onReRun}><RotateCcw size={15} /> Re-run screening</button>
        <button style={btn("ghost")} onClick={onRestart}>Start a new screening</button>
      </div>
    </div>
  );
}


/* ============================== DASHBOARD ============================== */
function Dashboard({ jobs, onCreateJob, onSelectJob, onDeleteJob, onAddResumes, onLoadSample }) {
  const totalJobs = jobs.length;
  let totalScreened = 0;
  let totalShortlisted = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  jobs.forEach((j) => {
    const screened = (j.candidates || []).filter((c) => c.status === "done" && c.result);
    totalScreened += screened.length;
    screened.forEach((c) => {
      scoreSum += c.result.overallScore;
      scoreCount++;
      if (c.result.overallScore >= 70) {
        totalShortlisted++;
      }
    });
  });

  const avgFit = scoreCount ? Math.round(scoreSum / scoreCount) : 0;

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 26, flexWrap: "wrap" }}>
        <StatCard icon={<Briefcase size={14} />} label="Active Roles" value={totalJobs} />
        <StatCard icon={<Users size={14} />} label="Total Screened" value={totalScreened} />
        <StatCard icon={<Star size={14} />} label="Shortlisted (70+)" value={totalShortlisted} accent={C.accent} />
        <StatCard icon={<Target size={14} />} label="Avg Fit Score" value={scoreCount ? `${avgFit}%` : "—"} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: C.ink, margin: 0 }}>
          Role Directory
        </h2>
        <button style={btn("primary")} onClick={onCreateJob}>
          <Plus size={16} /> Create New Role
        </button>
      </div>

      {totalJobs === 0 ? (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14,
          padding: "50px 24px", textAlign: "center" }}>
          <Briefcase size={40} color={C.faint} style={{ marginBottom: 12, opacity: 0.7 }} />
          <h3 style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 600, color: C.ink, margin: "0 0 8px" }}>
            No Active Roles Yet
          </h3>
          <p style={{ fontSize: 14, color: C.sub, maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.5 }}>
            Create a new role definition to start screening and ranking candidate resumes locally.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button style={btn("primary")} onClick={onCreateJob}>
              <Plus size={15} /> Create your first role
            </button>
            <button style={btn("ghost")} onClick={onLoadSample}>
              <Sparkles size={15} /> Load sample role
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
          {jobs.map((j) => {
            const screened = (j.candidates || []).filter((c) => c.status === "done" && c.result);
            const totalCand = (j.candidates || []).length;
            const topCand = [...screened].sort((a, b) => b.result.overallScore - a.result.overallScore)[0];
            const hasScreenings = screened.length > 0;

            return (
              <div
                key={j.id}
                onClick={() => onSelectJob(j.id)}
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: "20px 22px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 190,
                  boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = C.line;
                  e.currentTarget.style.boxShadow = "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)";
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <h3 style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.25 }}>
                      {j.title || "Untitled Role"}
                    </h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button
                        title="Add new resumes to this role"
                        onClick={(e) => onAddResumes(j.id, e)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: C.faint,
                          padding: 2,
                          transition: "color 0.1s",
                          display: "flex",
                          alignItems: "center"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = C.accent}
                        onMouseLeave={(e) => e.currentTarget.style.color = C.faint}
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        title="Delete this role"
                        onClick={(e) => onDeleteJob(j.id, e)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          color: C.faint,
                          padding: 2,
                          transition: "color 0.1s",
                          display: "flex",
                          alignItems: "center"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = REC["Weak Match"].dot}
                        onMouseLeave={(e) => e.currentTarget.style.color = C.faint}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, background: C.lineSoft, padding: "2px 6px", borderRadius: 4 }}>
                      {j.seniority}
                    </span>
                    {j.location && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.sub, background: C.lineSoft, padding: "2px 6px", borderRadius: 4 }}>
                        {j.location}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div style={{ height: 1, background: C.lineSoft, marginBottom: 12 }} />
                  
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.sub, marginBottom: 6 }}>
                    <span>Candidates Ingested:</span>
                    <span style={{ fontWeight: 700, color: C.ink }}>{totalCand}</span>
                  </div>
                  
                  {totalCand > 0 && (
                    <div style={{ fontSize: 12, color: C.sub, marginBottom: 12 }}>
                      {hasScreenings ? (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Screening Complete:</span>
                          <span style={{ fontWeight: 700, color: REC["Strong Match"].dot }}>
                            {screened.length} of {totalCand}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: C.faint, fontStyle: "italic" }}>Awaiting screening</span>
                      )}
                    </div>
                  )}

                  {topCand && (
                    <div style={{ background: C.accentSoft, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: C.accentDeep, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
                        <Star size={12} /> Top Fit: {(topCand.result.candidateName || topCand.label).trim().split(" ")[0]}
                      </span>
                      <span style={{ fontWeight: 800 }}>{topCand.result.overallScore}%</span>
                    </div>
                  )}

                  <button
                    style={{
                      ...btn(hasScreenings ? "soft" : "primary"),
                      width: "100%",
                      justifyContent: "center",
                      padding: "8px 0",
                      fontSize: 13,
                      marginTop: 4
                    }}
                  >
                    {hasScreenings ? "View Results" : totalCand > 0 ? "Run Screening" : "Add Resumes"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================== AI INTERVIEW ROOM ============================== */
function AIInterviewRoom({ candidate, job, onClose, onSaveInterview }) {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  const candidateName = candidate.result?.candidateName || candidate.label;
  const skills = candidate.result?.topSkills || [];

  // Scroll to bottom when messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  // Load initial greeting
  useEffect(() => {
    const startInterview = async () => {
      setLoading(true);
      setError("");
      try {
        const firstQuestion = await sendInterviewChat(job, candidate, []);
        setHistory([{ role: "interviewer", content: firstQuestion }]);
      } catch (err) {
        console.error(err);
        setError("Failed to start the interview session. Please check your backend.");
      } finally {
        setLoading(false);
      }
    };
    startInterview();
  }, [job, candidate]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const t = input.trim();
    if (!t || loading || evaluating) return;

    const newHistory = [...history, { role: "candidate", content: t }];
    setHistory(newHistory);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const nextQuestion = await sendInterviewChat(job, candidate, newHistory);
      setHistory([...newHistory, { role: "interviewer", content: nextQuestion }]);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch response. Please try sending again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (history.length < 2) {
      setError("Please have at least one round of conversation before grading.");
      return;
    }
    setEvaluating(true);
    setLoading(false);
    setError("");

    try {
      const result = await evaluateInterview(job, candidate, history);
      setEvaluationResult(result);
    } catch (err) {
      console.error(err);
      setError("Failed to evaluate the interview. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleSaveAndClose = () => {
    if (evaluationResult) {
      onSaveInterview(candidate.id, {
        score: evaluationResult.score,
        summary: evaluationResult.summary,
        transcript: history
      });
    }
    onClose();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      padding: 24, boxSizing: "border-box"
    }}>
      <div style={{
        background: C.bg, width: "100%", maxWidth: 880, height: "85vh",
        borderRadius: 16, display: "grid", gridTemplateColumns: "250px 1fr",
        overflow: "hidden", border: `1px solid ${C.line}`,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}>
        {/* Left Sidebar */}
        <div style={{
          background: C.paper, borderRight: `1px solid ${C.line}`,
          padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between"
        }}>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: DISPLAY }}>
              AI Interview Room
            </h4>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 20 }}>
              Testing fit for: {job.title}
            </div>

            <SubHead style={{ marginBottom: 8 }}>Candidate</SubHead>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 16 }}>
              {candidateName}
            </div>

            <SubHead style={{ marginBottom: 8 }}>Claimed Skills</SubHead>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 20 }}>
              {skills.map((s) => (
                <span key={s} style={{
                  fontSize: 11, fontWeight: 600, color: C.accentDeep,
                  background: C.accentSoft, padding: "3px 7px", borderRadius: 5
                }}>{s}</span>
              ))}
            </div>
          </div>

          <div>
            {evaluationResult ? (
              <button style={{ ...btn("primary"), width: "100%", justifyContent: "center" }} onClick={handleSaveAndClose}>
                Save & Close
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  style={{ ...btn("primary"), width: "100%", justifyContent: "center", background: REC["Strong Match"].dot }}
                  onClick={handleEvaluate}
                  disabled={loading || evaluating || history.length < 2}
                >
                  {evaluating ? (
                    <>
                      <Loader2 className="spin" size={14} /> Grading...
                    </>
                  ) : "Finish & Score"}
                </button>
                <button style={{ ...btn("ghost"), width: "100%", justifyContent: "center" }} onClick={onClose}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Main Chat/Result Area */}
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: C.bg }}>
          {evaluationResult ? (
            /* Results Screen */
            <div style={{ padding: 30, overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{
                  display: "inline-flex", width: 70, height: 70, borderRadius: "50%",
                  background: REC[evaluationResult.score >= 70 ? "Strong Match" : "Possible Match"].bg,
                  color: REC[evaluationResult.score >= 70 ? "Strong Match" : "Possible Match"].dot,
                  alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700,
                  marginBottom: 10, border: `2px solid ${REC[evaluationResult.score >= 70 ? "Strong Match" : "Possible Match"].dot}`
                }}>
                  {evaluationResult.score}%
                </div>
                <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 20, color: C.ink }}>
                  Interview Score Compiled
                </h3>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                  Technical confidence assessment based on candidate's conversational responses.
                </p>
              </div>

              <Panel title="Assessor's Feedback Summary">
                <p style={{ fontSize: 14, color: C.ink, lineHeight: 1.6, margin: 0 }}>
                  {evaluationResult.summary}
                </p>
              </Panel>

              <Panel title="Interview Transcript Review">
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 200, overflowY: "auto", paddingRight: 6 }}>
                  {history.map((m, idx) => (
                    <div key={idx} style={{ fontSize: 12.8, lineHeight: 1.4 }}>
                      <strong style={{ color: m.role === "interviewer" ? C.accent : REC["Possible Match"].dot }}>
                        {m.role === "interviewer" ? "AI Interviewer" : candidateName}:
                      </strong>{" "}
                      <span style={{ color: C.sub }}>{m.content}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          ) : (
            /* Chat Interface */
            <>
              {/* Messages Area */}
              <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
                {history.length === 0 && loading && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <div style={{ textAlign: "center", color: C.faint }}>
                      <Loader2 className="spin" size={24} style={{ marginBottom: 8 }} />
                      <div>Setting up SRM virtual interview room...</div>
                    </div>
                  </div>
                )}

                {history.map((m, idx) => {
                  const isAI = m.role === "interviewer";
                  return (
                    <div key={idx} style={{
                      display: "flex",
                      justifyContent: isAI ? "flex-start" : "flex-end"
                    }}>
                      <div style={{
                        maxWidth: "70%",
                        background: isAI ? C.paper : C.accent,
                        color: isAI ? C.ink : "#FFF8F2",
                        padding: "12px 16px",
                        borderRadius: isAI ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        border: isAI ? `1px solid ${C.line}` : "none"
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.6, marginBottom: 4 }}>
                          {isAI ? "AI Interviewer" : candidateName}
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                          {m.content}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && history.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{
                      background: C.paper, border: `1px solid ${C.line}`,
                      padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
                      display: "flex", alignItems: "center", gap: 8, color: C.faint, fontSize: 13
                    }}>
                      <Loader2 className="spin" size={14} />
                      <span>Interviewer is thinking...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div style={{
                    background: REC["Weak Match"].bg, color: REC["Weak Match"].fg,
                    padding: "10px 14px", borderRadius: 8, fontSize: 13,
                    display: "flex", alignItems: "center", gap: 8, border: `1px solid ${REC["Weak Match"].dot}20`
                  }}>
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSend} style={{
                background: C.paper, padding: "16px 24px",
                borderTop: `1px solid ${C.line}`, display: "flex", gap: 12
              }}>
                <input
                  type="text"
                  style={inputStyle}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={loading ? "Waiting for AI..." : `Type your answer as ${candidateName}...`}
                  disabled={loading || evaluating}
                />
                <button
                  type="submit"
                  style={{ ...btn("primary"), padding: "0 22px" }}
                  disabled={loading || evaluating || !input.trim()}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== STANDALONE REMOTE ASSESSMENT PORTAL ============================== */
function RemoteAssessmentPortal({ candidateId }) {
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(true);
  const [cameraStream, setCameraStream] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [pasteCount, setPasteCount] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [finished, setFinished] = useState(false);

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);

  // Parse candidate info on load
  useEffect(() => {
    console.log("RemoteAssessmentPortal: Mount, fetching info for candidate ID:", candidateId);
    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/candidate-interview-info?candidateId=${candidateId}`);
        console.log("RemoteAssessmentPortal: fetch response status:", res.status);
        if (!res.ok) throw new Error("Could not find interview session");
        const data = await res.json();
        console.log("RemoteAssessmentPortal: fetched candidate data:", data);
        setCandidateInfo(data);
      } catch (err) {
        console.error("RemoteAssessmentPortal: fetch error:", err);
        setError(err.message || "Failed to load assessment room.");
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [candidateId]);

  // Bind camera stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      console.log("RemoteAssessmentPortal: binding camera stream to video element");
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, setupMode]);

  // Tab focus loss (Proctoring switch tracker)
  useEffect(() => {
    if (setupMode || finished || !candidateInfo) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => prev + 1);
        setShowWarning(true);
        // Clear warning after 4 seconds
        setTimeout(() => setShowWarning(false), 4000);
      }
    };

    const handleBlur = () => {
      setTabSwitches(prev => prev + 1);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [setupMode, finished, candidateInfo]);

  // Scroll to bottom when history updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loadingChat]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (e) => {
        const resultText = e.results[0][0].transcript;
        setInput(prev => (prev ? prev + " " + resultText : resultText));
      };

      rec.onerror = (e) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  // Automatic Text-to-Speech (TTS) reader for interviewer questions
  useEffect(() => {
    if (voiceEnabled && history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === "interviewer") {
        speak(lastMsg.content);
      }
    }
  }, [history, voiceEnabled]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = (text) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Zira") || v.name.includes("Microsoft")));
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    
    // Stop speaking if AI is reading
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  // Webcam request handler
  const requestMedia = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setError("Webcam and microphone access is required to take this proctored technical interview. Please verify your browser permissions.");
    }
  };

  const startInterview = async () => {
    if (!cameraStream) {
      setError("Please enable and verify your webcam/microphone before starting.");
      return;
    }
    setSetupMode(false);
    setLoadingChat(true);
    setError("");
    
    // Load first AI question
    try {
      const dummyCand = { id: candidateId, label: candidateInfo?.candidateName || "Candidate", result: { topSkills: candidateInfo?.skills || [] } };
      const firstQuestion = await sendInterviewChat({ title: candidateInfo?.jobTitle || "" }, dummyCand, []);
      setHistory([{ role: "interviewer", content: firstQuestion }]);
    } catch (err) {
      setError("Failed to start the interview. Please try refreshing.");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const t = input.trim();
    if (!t || loadingChat || evaluating) return;

    const newHistory = [...history, { role: "candidate", content: t }];
    setHistory(newHistory);
    setInput("");
    setLoadingChat(true);
    setError("");

    try {
      const dummyCand = { id: candidateId, label: candidateInfo?.candidateName || "Candidate", result: { topSkills: candidateInfo?.skills || [] } };
      const nextQuestion = await sendInterviewChat({ title: candidateInfo?.jobTitle || "" }, dummyCand, newHistory);
      setHistory([...newHistory, { role: "interviewer", content: nextQuestion }]);
    } catch (err) {
      setError("Connection error. Resending last message failed.");
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSubmitInterview = async () => {
    if (history.length < 2) {
      setError("Please answer at least one question before submitting.");
      return;
    }
    setEvaluating(true);
    setError("");

    try {
      const dummyCand = { id: candidateId, label: candidateInfo?.candidateName || "Candidate", result: { topSkills: candidateInfo?.skills || [] } };
      // 1. Evaluate transcript
      const evaluation = await evaluateInterview({ title: candidateInfo?.jobTitle || "" }, dummyCand, history, { tabSwitches, pasteCount });
      
      // 2. Submit to server
      const submitRes = await fetch("/api/candidate-interview-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          score: evaluation.score,
          summary: evaluation.summary,
          transcript: history,
          proctoring: {
            tabSwitches,
            mediaAccess: Boolean(cameraStream),
            pasteCount
          }
        })
      });

      if (!submitRes.ok) throw new Error("Submitting interview results failed.");
      
      // Stop webcam stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      setFinished(true);
    } catch (err) {
      setError(err.message || "Failed to submit assessment. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: C.bg }}>
        <Loader2 className="spin" size={40} color={C.accent} />
      </div>
    );
  }

  if (error && !candidateInfo) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: C.bg, padding: 24 }}>
        <Panel title="Assessment Session Error">
          <p style={{ color: REC["Weak Match"].fg, fontSize: 14 }}>{error}</p>
        </Panel>
      </div>
    );
  }

  if (finished) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: C.bg, padding: 24 }}>
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: "40px 32px", textAlign: "center", maxWidth: 480, width: "100%", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "inline-flex", width: 60, height: 60, borderRadius: "50%", background: REC["Strong Match"].bg, color: REC["Strong Match"].dot, alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>
            <Check size={28} />
          </div>
          <h2 style={{ fontFamily: DISPLAY, fontSize: 22, color: C.ink, margin: "0 0 8px 0" }}>
            Assessment Completed!
          </h2>
          <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.5, margin: "0 0 24px 0" }}>
            Thank you for completing the technical interview for the <strong>{candidateInfo?.jobTitle || "Job Role"}</strong> position. Your responses and proctoring metrics have been securely submitted to the recruitment team.
          </p>
          <div style={{ fontSize: 12, color: C.faint }}>
            You may now close this browser tab safely.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: C.bg, fontFamily: BODY }}>
      {/* Header Banner */}
      <header style={{
        background: C.paper, borderBottom: `1px solid ${C.line}`,
        padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <SrmLogo />
          <div style={{ width: 1, height: 40, background: C.line }} />
          <div>
            <h1 style={{ fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>
              AI Technical Assessment Room
            </h1>
            <div style={{ fontSize: 11.5, color: C.sub, marginTop: 1 }}>
              Proctored candidate portal · {candidateInfo?.jobTitle || "Job Role"}
            </div>
          </div>
        </div>
        
        {!setupMode && (
          <div style={{
            background: REC["Weak Match"].bg, color: REC["Weak Match"].fg,
            padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 5
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: REC["Weak Match"].dot, display: "inline-block" }} className="ping" />
            PROCTORING ACTIVE
          </div>
        )}
      </header>

      {/* Warning Overlay Banner */}
      {showWarning && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          background: REC["Weak Match"].fg, color: "#FFFFFF", padding: "10px 20px",
          borderRadius: 8, zIndex: 1100, display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, fontWeight: 600, boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}>
          <AlertCircle size={16} />
          <span>Warning: Focus lost! Navigating away is flagged and reported.</span>
        </div>
      )}

      {setupMode ? (
        /* Setup / Permission Screen */
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, width: "100%", maxWidth: 640, display: "grid", gridTemplateColumns: "1.1fr .9fr", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: 28 }}>
              <SubHead style={{ marginBottom: 4 }}>Welcome</SubHead>
              <h2 style={{ fontFamily: DISPLAY, fontSize: 20, color: C.ink, margin: "0 0 14px 0" }}>
                {candidateInfo?.candidateName || "Candidate"}
              </h2>
              <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, margin: "0 0 20px 0" }}>
                You are about to start your technical interview for the role of <strong>{candidateInfo?.jobTitle || "Job Role"}</strong>. 
                <br/><br/>
                This is a secure proctored assessment. Please ensure:
              </p>
              <ul style={{ paddingLeft: 16, fontSize: 12.5, color: C.sub, lineHeight: 1.6, margin: "0 0 20px 0" }}>
                <li>Your webcam and microphone are enabled.</li>
                <li>You are in a quiet, well-lit room.</li>
                <li>You do not switch tabs or minimize this window during the interview.</li>
              </ul>
              
              {error && (
                <div style={{ background: REC["Weak Match"].bg, color: REC["Weak Match"].fg, padding: "8px 12px", borderRadius: 8, fontSize: 11.5, marginBottom: 14, border: `1px solid ${REC["Weak Match"].dot}20` }}>
                  {error}
                </div>
              )}

              {cameraStream ? (
                <button style={{ ...btn("primary"), width: "100%", justifyContent: "center" }} onClick={startInterview}>
                  Start Assessment
                </button>
              ) : (
                <button style={{ ...btn("primary"), width: "100%", justifyContent: "center" }} onClick={requestMedia}>
                  Enable Camera &amp; Mic
                </button>
              )}
            </div>
            <div style={{ background: "#F1F5F9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, borderLeft: `1px solid ${C.line}` }}>
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 10, background: "#0F172A", transform: "scaleX(-1)" }} />
              ) : (
                <div style={{ textAlign: "center", color: C.faint }}>
                  <Users size={32} style={{ marginBottom: 8 }} />
                  <div style={{ fontSize: 11, fontWeight: 700 }}>CAMERA PREVIEW</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Proctored Chat Screen */
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 280px", overflow: "hidden", height: "calc(100vh - 78px)" }}>
          {/* Main Chat Workspace */}
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Messages */}
            <div style={{ flex: 1, padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
              {history.length === 0 && loadingChat && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <div style={{ textAlign: "center", color: C.faint }}>
                    <Loader2 className="spin" size={24} style={{ marginBottom: 8 }} />
                    <div>Loading technical assessment content...</div>
                  </div>
                </div>
              )}

              {history.map((m, idx) => {
                const isAI = m.role === "interviewer";
                return (
                  <div key={idx} style={{ display: "flex", justifyContent: isAI ? "flex-start" : "flex-end" }}>
                    <div style={{
                      maxWidth: "70%",
                      background: isAI ? C.paper : C.accent,
                      color: isAI ? C.ink : "#FFF8F2",
                      padding: "12px 16px",
                      borderRadius: isAI ? "16px 16px 16px 4px" : "16px 16px 4px 16px",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      border: isAI ? `1px solid ${C.line}` : "none"
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, opacity: 0.6, marginBottom: 3 }}>
                        {isAI ? "AI Interviewer" : (candidateInfo?.candidateName || "Candidate")}
                      </div>
                      <div style={{ fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </div>
                      {isAI && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
                          <button 
                            type="button"
                            style={{
                              background: "none",
                              border: "none",
                              color: C.accentDeep,
                              fontSize: 11,
                              cursor: "pointer",
                              padding: "2px 6px",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              fontWeight: 600
                            }}
                            onClick={() => speak(m.content)}
                            title="Listen to this question"
                          >
                            🔊 Listen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {loadingChat && history.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: C.paper, border: `1px solid ${C.line}`, padding: "12px 16px", borderRadius: "16px 16px 16px 4px", display: "flex", alignItems: "center", gap: 8, color: C.faint, fontSize: 13 }}>
                    <Loader2 className="spin" size={14} />
                    <span>Interviewer is formulating next question...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{ background: C.paper, padding: "16px 24px", borderTop: `1px solid ${C.line}`, display: "flex", gap: 12 }}>
              <input
                type="text"
                style={inputStyle}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if ("speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                }}
                onPaste={() => {
                  setPasteCount(prev => prev + 1);
                  console.log("Proctoring alert: copy-paste detected!");
                }}
                placeholder={loadingChat ? "Waiting for AI..." : isListening ? "Listening... Speak now!" : "Type or speak your answer here..."}
                disabled={loadingChat || evaluating}
              />
              <button 
                type="button" 
                style={{ 
                  ...btn(isListening ? "primary" : "ghost"), 
                  padding: "0 12px", 
                  background: isListening ? "#EF4444" : "transparent",
                  color: isListening ? "#FFFFFF" : C.ink,
                  border: isListening ? "none" : `1px solid ${C.line}`
                }} 
                onClick={toggleListening}
                disabled={loadingChat || evaluating}
                title="Speak your answer"
              >
                {isListening ? "🎤 Stop" : "🎤 Speak"}
              </button>
              <button type="submit" style={{ ...btn("primary"), padding: "0 22px" }} disabled={loadingChat || evaluating || !input.trim()}>
                Send
              </button>
            </form>
          </div>

          {/* Right Proctoring Sidebar */}
          <div style={{ background: C.paper, borderLeft: `1px solid ${C.line}`, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} className="ping" />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A", letterSpacing: ".06em" }}>MONITORING ACTIVE</span>
              </div>
              
              {/* Live Webcam Box */}
              <div style={{ background: "#0F172A", borderRadius: 8, overflow: "hidden", marginBottom: 18, border: `1.5px solid ${C.lineSoft}` }}>
                <video ref={(el) => { if (el && cameraStream && !el.srcObject) el.srcObject = cameraStream; }} autoPlay playsInline muted style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
              </div>

              <SubHead style={{ marginBottom: 6 }}>Assessment Focus</SubHead>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 18 }}>
                {(candidateInfo?.skills || []).map((s) => (
                  <span key={s} style={{ fontSize: 10.5, fontWeight: 600, color: C.accentDeep, background: C.accentSoft, padding: "3px 6px", borderRadius: 5 }}>{s}</span>
                ))}
              </div>

              <div style={{ height: 1, background: C.lineSoft, margin: "14px 0" }} />
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.sub, marginBottom: 6 }}>
                <span>Questions Posed:</span>
                <span style={{ fontWeight: 700, color: C.ink }}>{Math.floor(history.length / 2)}</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.sub, marginBottom: 12 }}>
                <span>Tab Warnings:</span>
                <span style={{ fontWeight: 700, color: tabSwitches > 0 ? REC["Weak Match"].dot : "#16A34A" }}>{tabSwitches}</span>
              </div>

              <div style={{ height: 1, background: C.lineSoft, margin: "14px 0" }} />
              
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <SubHead style={{ marginBottom: 4 }}>Voice Interview Mode</SubHead>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: C.sub }}>Read Aloud (TTS):</span>
                  <button 
                    type="button"
                    style={{
                      ...btn(voiceEnabled ? "primary" : "ghost"),
                      padding: "4px 10px",
                      fontSize: 11,
                      border: voiceEnabled ? "none" : `1px solid ${C.line}`
                    }}
                    onClick={() => {
                      const newMode = !voiceEnabled;
                      setVoiceEnabled(newMode);
                      if (newMode && history.length > 0) {
                        const lastMsg = history[history.length - 1];
                        if (lastMsg.role === "interviewer") {
                          speak(lastMsg.content);
                        }
                      } else {
                        if ("speechSynthesis" in window) {
                          window.speechSynthesis.cancel();
                        }
                      }
                    }}
                  >
                    {voiceEnabled ? "On" : "Off"}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                style={{ ...btn("primary"), width: "100%", justifyContent: "center", background: "#16A34A" }}
                onClick={handleSubmitInterview}
                disabled={evaluating || loadingChat || history.length < 2}
              >
                {evaluating ? (
                  <>
                    <Loader2 className="spin" size={14} /> Submitting...
                  </>
                ) : "Submit Assessment"}
              </button>
              {error && (
                <div style={{ background: REC["Weak Match"].bg, color: REC["Weak Match"].fg, padding: "8px 10px", borderRadius: 6, fontSize: 11.5, marginTop: 10, border: `1px solid ${REC["Weak Match"].dot}20` }}>
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 30, background: "#FEF2F2", color: "#991B1B", fontFamily: "monospace", minHeight: "100vh" }}>
          <h2>Something went wrong in the SIFT React application.</h2>
          <pre style={{ background: "#FEE2E2", padding: 20, borderRadius: 8, overflowX: "auto" }}>
            {this.state.error?.stack || String(this.state.error)}
          </pre>
          <button style={{ padding: "8px 16px", background: "#991B1B", color: "#FFF", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 15 }} onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [view, setView] = useState("dashboard"); // "dashboard" | "wizard" | "remote-interview"
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeJobId, setActiveJobId] = useState(null);
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [fatal, setFatal] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [activeInterviewCandidate, setActiveInterviewCandidate] = useState(null);
  const [remoteCandidateId, setRemoteCandidateId] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiConfig, setAiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("sift_ai_config");
      return saved ? JSON.parse(saved) : { provider: "default", model: "", apiKey: "" };
    } catch (e) {
      return { provider: "default", model: "", apiKey: "" };
    }
  });

  useEffect(() => {
    localStorage.setItem("sift_ai_config", JSON.stringify(aiConfig));
  }, [aiConfig]);

  // Parse candidateId query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const candId = params.get("candidateId");
    if (candId) {
      setRemoteCandidateId(candId);
      setView("remote-interview");
      setLoading(false);
    }
  }, []);

  const activeJob = useMemo(() => jobs.find((j) => j.id === activeJobId), [jobs, activeJobId]);

  // Derived states from activeJob
  const jobDetails = activeJob || {
    title: "", seniority: "Senior", minYears: 3, location: "", description: "",
    mustHave: [], niceToHave: [],
  };
  const candidates = activeJob ? activeJob.candidates || [] : [];
  const screening = activeJob ? activeJob.screening || "idle" : "idle";

  const goto = (n) => { setStep(n); setMaxReached((m) => Math.max(m, n)); };

  // Fetch jobs from server SQLite on mount
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await fetch("/api/jobs");
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (e) {
        console.error("Failed to fetch jobs from server database:", e);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  // Sync state changes to server SQLite with debounce
  useEffect(() => {
    if (loading) return;
    
    // Skip database syncing while screening is actively running to prevent performance degradation
    if (screening === "running") return;

    const saveJobsToServer = async () => {
      // Strip candidates base64 content only for already successfully screened candidates to keep sync payload small
      const cleanedJobs = jobs.map((job) => ({
        ...job,
        candidates: (job.candidates || []).map((c) => {
          if (c.status === "done" && c.result) {
            const { base64, ...rest } = c;
            return rest;
          }
          return c;
        })
      }));

      try {
        const res = await fetch("/api/save-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobs: cleanedJobs }),
        });
        if (!res.ok) throw new Error("Server responded with error status: " + res.status);
        setStorageError(false);
      } catch (e) {
        console.error("SQLite database sync failed:", e);
        setStorageError(true);
      }
    };

    const timer = setTimeout(saveJobsToServer, 300);
    return () => clearTimeout(timer);
  }, [jobs, loading, screening]);

  if (view === "remote-interview") {
    return <RemoteAssessmentPortal candidateId={remoteCandidateId} />;
  }

  const updateActiveJob = (updater) => {
    setJobs((prevJobs) => {
      return prevJobs.map((j) => {
        if (j.id === activeJobId) {
          return updater(j);
        }
        return j;
      });
    });
  };

  const handleSaveInterview = (candidateId, interviewData) => {
    updateActiveJob((j) => ({
      ...j,
      candidates: j.candidates.map((c) => {
        if (c.id === candidateId) {
          return {
            ...c,
            result: {
              ...c.result,
              interview: interviewData
            }
          };
        }
        return c;
      })
    }));
  };

  const handleCreateJob = () => {
    const newId = `job_${Date.now()}`;
    const newJob = {
      id: newId,
      title: "",
      seniority: "Senior",
      minYears: 3,
      location: "",
      description: "",
      mustHave: [],
      niceToHave: [],
      candidates: [],
      screening: "idle",
    };
    setJobs((prevJobs) => [newJob, ...prevJobs]);
    setActiveJobId(newId);
    setStep(1);
    setMaxReached(1);
    setView("wizard");
  };

  const handleLoadSample = () => {
    const newId = `job_${Date.now()}`;
    const newJob = {
      id: newId,
      ...SAMPLE_JOB,
      candidates: SAMPLE_RESUMES.map((r, idx) => ({
        id: `c${idx}_${Date.now()}`,
        kind: "text",
        text: r.text,
        label: r.label,
        status: "idle",
        result: null,
        error: null,
      })),
      screening: "idle",
    };
    setJobs((prevJobs) => [newJob, ...prevJobs]);
    setActiveJobId(newId);
    setStep(2);
    setMaxReached(2);
    setView("wizard");
  };

  const handleSelectJob = (id) => {
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    setActiveJobId(id);
    if (target.candidates.length === 0) {
      setStep(1);
      setMaxReached(1);
    } else {
      const screened = target.candidates.filter(c => c.status === "done" && c.result);
      if (screened.length > 0) {
        setStep(3);
        setMaxReached(3);
      } else {
        setStep(2);
        setMaxReached(2);
      }
    }
    setView("wizard");
  };

  const handleDeleteJob = (id, e) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this job role and all its screened candidates?")) {
      setJobs((prevJobs) => prevJobs.filter((j) => j.id !== id));
      if (activeJobId === id) {
        setActiveJobId(null);
        setView("dashboard");
      }
    }
  };

  const handleOpenAddResumes = (id, e) => {
    if (e) e.stopPropagation();
    const target = jobs.find((j) => j.id === id);
    if (!target) return;
    setActiveJobId(id);
    setStep(2);
    setMaxReached(Math.max(maxReached, 2));
    setView("wizard");
  };

  const runScreening = async (forceAll = false) => {
    if (!activeJob) return;
    setFatal("");
    
    // Sync current state to database immediately before screening starts to prevent race condition
    const cleanedJobs = jobs.map((job) => ({
      ...job,
      candidates: (job.candidates || []).map((c) => {
        if (c.status === "done" && c.result) {
          const { base64, ...rest } = c;
          return rest;
        }
        return c;
      })
    }));
    try {
      await fetch("/api/save-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: cleanedJobs }),
      });
    } catch (e) {
      console.error("Pre-screening database sync failed:", e);
    }
    
    // Determine which candidates need screening
    const candidatesToScreen = forceAll
      ? activeJob.candidates
      : activeJob.candidates.filter((c) => c.status !== "done" || !c.result);

    if (candidatesToScreen.length === 0) {
      updateActiveJob((j) => ({ ...j, screening: "done" }));
      goto(3);
      return;
    }
    
    // Set only the targeted candidates to queued, keeping already screened candidates intact
    updateActiveJob((j) => ({
      ...j,
      screening: "running",
      candidates: j.candidates.map((c) => {
        const shouldScreen = forceAll || c.status !== "done" || !c.result;
        return shouldScreen ? { ...c, status: "queued", result: null, error: null } : c;
      }),
    }));

    goto(3);

    try {
      await runPool(candidatesToScreen, 1, async (cand) => {
        updateActiveJob((j) => ({
          ...j,
          candidates: j.candidates.map((c) => (c.id === cand.id ? { ...c, status: "analyzing" } : c)),
        }));

        // Add a 2-second sleep between requests to respect free-tier rate limits (TPM)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let resume;
        if (cand.kind === "file") {
          resume = cand.base64
            ? { type: "file", filename: cand.filename, base64: cand.base64 }
            : { type: "db", candidateId: cand.id };
        } else {
          resume = { type: "text", text: cand.text || "" };
        }

        // Strip candidates list from job definition to keep request payload lightweight
        const { candidates: _, ...jobCriteria } = activeJob;

        try {
          const result = await analyzeCandidate(jobCriteria, resume, aiConfig);
          updateActiveJob((j) => ({
            ...j,
            candidates: j.candidates.map((c) => (c.id === cand.id ? { ...c, status: "done", result, base64: null } : c)),
          }));
        } catch (e) {
          updateActiveJob((j) => ({
            ...j,
            candidates: j.candidates.map((c) =>
              (c.id === cand.id ? { ...c, status: "error", error: String(e.message || e) } : c)),
          }));
        }
      });
    } catch (e) {
      setFatal("Screening could not complete: " + (e.message || e));
    }
    
    updateActiveJob((j) => ({ ...j, screening: "done" }));
  };

  const handleUpdateJobDetails = (updatedJobDetails) => {
    updateActiveJob((j) => ({ ...j, ...updatedJobDetails }));
  };

  const handleUpdateCandidates = (updatedCandidates) => {
    updateActiveJob((j) => ({
      ...j,
      candidates: typeof updatedCandidates === "function" ? updatedCandidates(j.candidates || []) : updatedCandidates
    }));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: C.bg }}>
        <Loader2 className="spin" size={40} color={C.accent} />
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: BODY, color: C.ink }}>
      <div style={{ maxWidth: 980, margin: "0 auto", padding: "26px 24px 60px" }}>

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <SrmLogo />
            <div style={{ width: 1, height: 55, background: C.line }} />
            <div>
              <h1 style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 800, margin: 0,
                letterSpacing: "-.01em", color: C.ink }}>
                AI Resume Screening &amp; Shortlist Portal
              </h1>
              <div style={{ fontSize: 13.5, color: C.sub, marginTop: 3 }}>
                Autonomous offline candidate screening, fit scoring, and ranking engine.
              </div>
            </div>
          </div>
          
          {view === "wizard" && (
            <button
              onClick={() => setView("dashboard")}
              style={{
                ...btn("ghost"),
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Home size={15} /> Back to Dashboard
            </button>
          )}
        </header>

        <div style={{ height: 1, background: C.line, margin: "16px 0 20px" }} />

        {storageError && (
          <div style={{ background: "#FEE2E2", color: "#B91C1C", fontSize: 13,
            padding: "10px 13px", borderRadius: 9, marginBottom: 14, display: "flex", alignItems: "center", gap: 7, border: "1px solid #FCA5A5" }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} /> 
            <span>
              <strong>Sync Warning:</strong> Failed to save updates to the server SQLite database. Please ensure your backend is running.
            </span>
          </div>
        )}

        {view === "dashboard" ? (
          <Dashboard
            jobs={jobs}
            onCreateJob={handleCreateJob}
            onSelectJob={handleSelectJob}
            onDeleteJob={handleDeleteJob}
            onAddResumes={handleOpenAddResumes}
            onLoadSample={handleLoadSample}
          />
        ) : (
          <>
            <div style={{ marginBottom: 22 }}>
              <Stepper step={step} maxReached={maxReached} go={goto} />
            </div>

            {fatal && (
              <div style={{ background: REC["Weak Match"].bg, color: REC["Weak Match"].fg, fontSize: 13,
                padding: "10px 13px", borderRadius: 9, marginBottom: 14, display: "flex", gap: 7 }}>
                <AlertCircle size={16} /> {fatal}
              </div>
            )}

            {step === 1 && <RoleStep job={jobDetails} setJob={handleUpdateJobDetails} onNext={() => goto(2)} />}
            {step === 2 && (
              <CandidateStep candidates={candidates} setCandidates={handleUpdateCandidates}
                onBack={() => goto(1)} onRun={() => runScreening(false)} />
            )}
            {step === 3 && screening === "running" && <Analyzing candidates={candidates} />}
            {step === 3 && screening === "done" && (
              <Results candidates={candidates} job={jobDetails}
                onReRun={() => runScreening(true)}
                onRestart={() => {
                  updateActiveJob(j => ({ ...j, candidates: [], screening: "idle" }));
                  setMaxReached(1);
                  setStep(1);
                }}
                onStartInterview={(cand) => setActiveInterviewCandidate(cand)} />
            )}
          </>
        )}

        <footer style={{ marginTop: 34, fontSize: 11.5, color: C.faint, textAlign: "center",
          lineHeight: 1.6 }}>
          Pipeline: define role → ingest resumes (PDF / DOCX / TXT) → AI agent parses &amp; scores
          each resume → rank, shortlist &amp; recommend.
        </footer>
        {activeInterviewCandidate && (
          <AIInterviewRoom
            candidate={activeInterviewCandidate}
            job={jobDetails}
            onClose={() => setActiveInterviewCandidate(null)}
            onSaveInterview={handleSaveInterview}
          />
        )}
      </div>
    </div>
  );
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
