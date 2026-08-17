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
  Mail, MessageSquare, Play, Building2, Activity, Settings, Moon, Sun, Layers,
  ShieldCheck, ExternalLink, Filter, Copy, RefreshCw, ChevronUp, Cpu
} from "lucide-react";
import { analyzeCandidate, fileToBase64, sendInterviewChat, evaluateInterview } from "./api.js";

/* ============================== THEME SYSTEM ============================== */
const THEMES = {
  light: {
    name: "Light Mode",
    bg: "#F8FAFC",
    paper: "#FFFFFF",
    panel: "#FFFFFF",
    sidebar: "#0F172A",
    sidebarText: "#94A3B8",
    sidebarActive: "#FFFFFF",
    sidebarActiveBg: "#1E293B",
    ink: "#0F172A",
    sub: "#475569",
    faint: "#94A3B8",
    line: "#E2E8F0",
    lineSoft: "#F1F5F9",
    lineDark: "#CBD5E1",
    accent: "#034DA1",
    accentDeep: "#023570",
    accentSoft: "#EBF3FC",
    cardBorder: "#E2E8F0",
  },
  dark: {
    name: "Dark Mode",
    bg: "#0B0F17",
    paper: "#151C28",
    panel: "#1E293B",
    sidebar: "#0F172A",
    sidebarText: "#94A3B8",
    sidebarActive: "#38BDF8",
    sidebarActiveBg: "#1E293B",
    ink: "#F8FAFC",
    sub: "#CBD5E1",
    faint: "#64748B",
    line: "#1E293B",
    lineSoft: "#1E293B",
    lineDark: "#334155",
    accent: "#38BDF8",
    accentDeep: "#0284C7",
    accentSoft: "rgba(56, 189, 248, 0.12)",
    cardBorder: "#1E293B",
  },
  "srm-blue": {
    name: "SRM Corporate Blue",
    bg: "#031B3A",
    paper: "#062854",
    panel: "#08346C",
    sidebar: "#02132B",
    sidebarText: "#94A3B8",
    sidebarActive: "#38BDF8",
    sidebarActiveBg: "#08346C",
    ink: "#F8FAFC",
    sub: "#93C5FD",
    faint: "#60A5FA",
    line: "#0A438A",
    lineSoft: "#08346C",
    lineDark: "#1D4ED8",
    accent: "#38BDF8",
    accentDeep: "#0284C7",
    accentSoft: "rgba(56, 189, 248, 0.15)",
    cardBorder: "#0A438A",
  },
  glass: {
    name: "Glassmorphism Dark",
    bg: "#090D16",
    paper: "rgba(21, 28, 44, 0.75)",
    panel: "rgba(30, 41, 59, 0.65)",
    sidebar: "rgba(15, 23, 42, 0.9)",
    sidebarText: "#94A3B8",
    sidebarActive: "#818CF8",
    sidebarActiveBg: "rgba(99, 102, 241, 0.2)",
    ink: "#F8FAFC",
    sub: "#CBD5E1",
    faint: "#64748B",
    line: "rgba(255, 255, 255, 0.08)",
    lineSoft: "rgba(255, 255, 255, 0.04)",
    lineDark: "rgba(255, 255, 255, 0.15)",
    accent: "#818CF8",
    accentDeep: "#4F46E5",
    accentSoft: "rgba(129, 140, 248, 0.15)",
    cardBorder: "rgba(255, 255, 255, 0.12)",
  }
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

const SrmLogo = ({ collapsed = false, theme = "light" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <svg width={collapsed ? "38" : "180"} height="50" viewBox="0 0 450 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="450" height="35" rx="6" fill="#034DA1" />
      <rect x="3" y="3" width="444" height="29" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="225" y="22" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontFamily="serif" fontWeight="bold" letterSpacing="3">CHENNAI RAMAPURAM</text>
      
      <circle cx="70" cy="102" r="42" fill="#034DA1" />
      <circle cx="70" cy="102" r="42" fill="none" stroke="#D4AF37" strokeWidth="2.5" />
      <circle cx="70" cy="102" r="32" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" />
      <circle cx="70" cy="102" r="23" fill="#034DA1" />
      
      <path d="M68,118 L68,110 Q68,104 64,102 Q68,104 72,102 Q72,110 72,118 Z" fill="#FFFFFF" />
      <path d="M53,102 C51,99 52,94 56,93 C55,89 59,85 63,87 C66,83 72,83 75,86 C79,84 83,87 83,91 Z" fill="#FFFFFF" />
      
      {!collapsed && (
        <>
          <text x="135" y="106" fill={theme === "light" ? "#034DA1" : "#38BDF8"} fontSize="72" fontFamily="serif" fontWeight="bold" letterSpacing="-1">SRM</text>
          <text x="135" y="128" fill={theme === "light" ? "#1E293B" : "#F8FAFC"} fontSize="17.2" fontFamily="serif" fontWeight="bold">INSTITUTE OF SCIENCE &amp; TECHNOLOGY</text>
          <text x="135" y="145" fill={theme === "light" ? "#475569" : "#94A3B8"} fontSize="13" fontFamily="serif" fontStyle="italic">(Deemed to be University)</text>
        </>
      )}
    </svg>
  </div>
);

const SAMPLE_COMPANIES = [
  { id: "comp_motherson", name: "Motherson Group", industry: "Automotive & Manufacturing", contactEmail: "hr@motherson.com", notes: "Key OEM partner for CAE simulation & mechanical roles", createdAt: new Date().toISOString() },
  { id: "comp_srmtech", name: "SRM Tech Solutions", industry: "Software & AI Services", contactEmail: "careers@srmtech.com", notes: "Campus recruitment & IT consulting partner", createdAt: new Date().toISOString() },
  { id: "comp_bosch", name: "Bosch India", industry: "Automotive Engineering", contactEmail: "ta@bosch.in", notes: "R&D hiring for Embedded & Mechatronics roles", createdAt: new Date().toISOString() }
];

const SAMPLE_JOB = {
  title: "Senior Machine Learning Engineer",
  seniority: "Senior",
  minYears: 5,
  location: "Bengaluru / Hybrid",
  description:
    "We are hiring a Senior Machine Learning Engineer to design, build, and deploy production ML systems. You will own models end to end — from data pipelines and experimentation to deployment, monitoring, and iteration. You will collaborate with product and data teams to ship recommendation and prediction features at scale.",
  mustHave: ["Python", "PyTorch or TensorFlow", "Machine Learning", "Model Deployment / MLOps", "SQL"],
  niceToHave: ["Kubernetes", "Recommendation Systems", "AWS or GCP", "Spark"],
};

const SAMPLE_RESUMES = [
  {
    label: "Vinay_Kotha_UG_NX_Designer.pdf",
    text: `VINAY KOTHA | Email: vinaykotha31@gmail.com | Phone: +91-9876543210
Degree: B.Tech in Mechanical Engineering, SRM Institute (2021)
Current Role: Design Engineer at Automotive Components Ltd (3 years)
Skills: Unigraphics NX, CAD Modeling, Sheet Metal Design, GD&T, Injection Mold Design, SolidWorks, Automotive Assembly.
Projects: Designed front bumper assembly for Tier-1 OEM using UG NX; optimized sheet metal bracket reducing weight by 14%.`,
  },
  {
    label: "Dianavinnarasi_Joseph_Math_PhD.pdf",
    text: `DR. DIANAVINNARASI JOSEPH | Email: josephdiana4866@gmail.com | Phone: +91-9123456789
Education: Ph.D. in Mathematics (2022), M.Sc. Mathematics (2018), B.Sc. Mathematics (2016).
Experience: Assistant Professor of Mathematics (2 years) at St. Joseph College.
Skills: Linear Algebra, Differential Equations, MATLAB, Numerical Analysis, Mathematical Modeling, LaTeX, Statistics, Python.
Publications: 6 peer-reviewed journal papers in Applied Mathematics and Fluid Dynamics.`,
  },
  {
    label: "Gokul_PS_Mechatronics.pdf",
    text: `GOKUL P.S. | Email: gokulmail015@gmail.com | Phone: +91-9988776655
Education: B.E. in Mechatronics Engineering (2015), M.E. Embedded Systems (2017).
Experience: Assistant Professor — Mechatronics & EEE, Chennai Institute of Technology (9 years experience).
Skills: Robotics, PLC Programming, LabVIEW, Microcontrollers, MATLAB/Simulink, Automation, Sensor Integration.`,
  },
  {
    label: "Patrick_Nelson_PhD_Scholar.pdf",
    text: `PATRICK NELSON S | Email: bpatrickroys796@gmail.com | Phone: +91-9001122334
Education: Ph.D. Research Scholar in Applied Mathematics (SRM IST, 2023), M.Sc. Applied Mathematics (2020).
Experience: Research Scholar / Teaching Assistant (1 year).
Skills: Machine Learning, Optimization Algorithms, Python, TensorFlow, R, Probability Theory, Complex Analysis, Data Analytics.`,
  }
];

let _id = 0;
const uid = () => `c${++_id}_${Date.now()}`;

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

const btn = (type, C) => {
  const base = {
    padding: "8px 14px",
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    border: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: BODY,
    transition: "all 0.15s ease",
  };
  if (type === "primary") return { ...base, background: C.accent, color: "#FFFFFF" };
  if (type === "soft") return { ...base, background: C.accentSoft, color: C.accent, border: `1px solid ${C.accent}` };
  if (type === "ghost") return { ...base, background: "transparent", color: C.ink, border: `1px solid ${C.line}` };
  return base;
};

const inputStyle = (C) => ({
  width: "100%",
  padding: "9px 12px",
  borderRadius: 7,
  border: `1px solid ${C.line}`,
  background: C.bg,
  color: C.ink,
  fontSize: 13.5,
  fontFamily: BODY,
  outline: "none",
  boxSizing: "border-box",
});

function Field({ label, hint, children, C }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 700, letterSpacing: ".06em",
        textTransform: "uppercase", color: C.sub, marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 12, color: C.faint, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const Panel = ({ title, sub, children, style, C, action }) => (
  <div style={{
    background: C.paper,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: 14,
    padding: 22,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    ...style
  }}>
    {(title || sub || action) && (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          {title && <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: C.ink, fontFamily: DISPLAY }}>{title}</h3>}
          {sub && <p style={{ fontSize: 12.5, color: C.sub, margin: "4px 0 0", fontFamily: BODY }}>{sub}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

function SkillEditor({ skills, onChange, placeholder, C }) {
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
          style={inputStyle(C)} value={v} placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button style={{ ...btn("soft", C), padding: "0 14px" }} onClick={add}><Plus size={16} /></button>
      </div>
      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
          {skills.map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6,
              background: C.accentSoft, color: C.accent, fontSize: 13, fontWeight: 600,
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

function Stepper({ step, maxReached, go, C }) {
  const steps = ["Define Job Criteria", "Add Resumes", "Review Shortlist & Recommend"];
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
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
              <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                background: active ? C.accent : done ? C.accentSoft : C.paper,
                color: active ? "#FFFFFF" : done ? C.accent : C.faint,
                border: `1px solid ${active ? C.accent : C.line}` }}>
                {done ? <Check size={14} /> : n}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500,
                color: active ? C.ink : C.sub }}>{label}</span>
            </div>
            {n < 3 && <div style={{ width: 24, height: 1, background: C.line }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function MiniBar({ label, value, C }) {
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

const SubHead = ({ children, style, C }) => (
  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase",
    color: C.sub, ...style }}>{children}</div>
);
const List = ({ items, color, icon, C }) => (
  <ul style={{ listStyle: "none", margin: "5px 0 0", padding: 0 }}>
    {(items || []).map((t, i) => (
      <li key={i} style={{ display: "flex", gap: 7, fontSize: 12.8, color: C.ink,
        lineHeight: 1.5, marginBottom: 4 }}>
        <span style={{ color, flexShrink: 0, marginTop: 2 }}>{icon}</span>{t}
      </li>
    ))}
  </ul>
);

/* ============================== STEP 1: ROLE DEFINITION ============================== */
function RoleStep({ job, setJob, companies, onNext, C }) {
  const ready = (job.title || "").trim() && (job.description || "").trim();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 22 }}>
      <Panel title="Define Job Criteria" sub="Specify the role requirements and select target client company" C={C}>
        <Field label="Target Client Company" C={C}>
          <select
            style={inputStyle(C)}
            value={job.companyId || ""}
            onChange={(e) => {
              const comp = companies.find(c => c.id === e.target.value);
              setJob({ ...job, companyId: e.target.value, companyName: comp ? comp.name : "" });
            }}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>🏢 {c.name} ({c.industry})</option>
            ))}
          </select>
        </Field>

        <Field label="Job title" C={C}>
          <input style={inputStyle(C)} value={job.title || ""}
            placeholder="e.g. Senior Machine Learning Engineer"
            onChange={(e) => setJob({ ...job, title: e.target.value })} />
        </Field>

        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ flex: 1 }}>
            <Field label="Seniority" C={C}>
              <select style={inputStyle(C)} value={job.seniority || "Senior"}
                onChange={(e) => setJob({ ...job, seniority: e.target.value })}>
                {["Intern", "Junior", "Mid-level", "Senior", "Lead / Principal", "Director"].map((s) =>
                  <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ width: 120 }}>
            <Field label="Min. years" C={C}>
              <input type="number" min={0} style={inputStyle(C)} value={job.minYears || 0}
                onChange={(e) => setJob({ ...job, minYears: Number(e.target.value) })} />
            </Field>
          </div>
        </div>

        <Field label="Location / work mode" C={C}>
          <input style={inputStyle(C)} value={job.location || ""}
            placeholder="e.g. Chennai / Hybrid / Remote"
            onChange={(e) => setJob({ ...job, location: e.target.value })} />
        </Field>

        <Field label="Job description" C={C}>
          <textarea style={{ ...inputStyle(C), minHeight: 130, resize: "vertical", lineHeight: 1.55 }}
            value={job.description || ""}
            placeholder="Key responsibilities, skills, and qualifications required for this client..."
            onChange={(e) => setJob({ ...job, description: e.target.value })} />
        </Field>
      </Panel>

      <div>
        <Panel title="Skills Criteria" sub="Must-have skills carry the primary weight during AI evaluation" C={C}>
          <Field label="Must-have skills" hint="Press Enter or + to add each required skill." C={C}>
            <SkillEditor skills={job.mustHave || []} placeholder="Add a required skill…"
              onChange={(v) => setJob({ ...job, mustHave: v })} C={C} />
          </Field>
          <Field label="Nice-to-have skills" C={C}>
            <SkillEditor skills={job.niceToHave || []} placeholder="Add a bonus skill…"
              onChange={(v) => setJob({ ...job, niceToHave: v })} C={C} />
          </Field>
        </Panel>

        <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
          <button style={btn("ghost", C)} onClick={() => setJob({ ...job, ...SAMPLE_JOB })}>
            <Sparkles size={15} /> Load sample role details
          </button>
          <button
            style={{ ...btn("primary", C), opacity: ready ? 1 : 0.45, cursor: ready ? "pointer" : "not-allowed", marginLeft: "auto" }}
            onClick={() => ready && onNext()}
          >
            Next: Add Resumes <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== STEP 2: ADD CANDIDATES ============================== */
function CandidateStep({ candidates, setCandidates, onBack, onRun, onGotoResults, llmProvider, C }) {
  const [drag, setDrag] = useState(false);
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState("");
  const fileRef = useRef(null);
  const pasteCount = useRef(0);

  const unscreenedCount = candidates.filter((c) => c.status !== "done" || !c.result).length;
  const screenedCount = candidates.length - unscreenedCount;
  
  const providerLabel = llmProvider === "claude" ? "Claude API" : llmProvider === "gemini" ? "Gemini API" : llmProvider === "groq" ? "Groq API" : "Local LLM";

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
      <Panel title="Add Resumes" sub="Upload candidate files or paste resume text for evaluation" C={C}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `1.5px dashed ${drag ? C.accent : C.lineDark}`,
            background: drag ? C.accentSoft : C.paper, borderRadius: 12, padding: "30px 18px",
            textAlign: "center", cursor: "pointer", transition: "all .15s" }}>
          <Upload size={26} color={C.accent} style={{ marginBottom: 8 }} />
          <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>Drop candidate resumes here</div>
          <div style={{ fontSize: 12.5, color: C.faint, marginTop: 3 }}>Supports PDF, DOCX and TXT files</div>
          <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt" style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)} />
        </div>

        <div style={{ margin: "16px 0 7px", fontSize: 12, fontWeight: 700, letterSpacing: ".06em",
          textTransform: "uppercase", color: C.sub }}>Or paste raw resume text</div>
        <textarea style={{ ...inputStyle(C), minHeight: 92, resize: "vertical" }}
          value={paste} placeholder="Paste candidate resume text here…"
          onChange={(e) => setPaste(e.target.value)} />
        <div style={{ display: "flex", gap: 9, marginTop: 9 }}>
          <button style={btn("soft", C)} onClick={addPaste}><Plus size={15} /> Add text resume</button>
          <button style={btn("ghost", C)} onClick={loadSamples}>
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

      <Panel title={`Candidate Pool (${candidates.length})`}
        sub="Resumes queued for AI screening against client criteria" C={C}>
        {candidates.length === 0 ? (
          <div style={{ color: C.faint, fontSize: 13.5, padding: "30px 0", textAlign: "center" }}>
            No resumes added yet. Upload or paste resumes to continue.
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
                    <FileText size={15} color={hasScore ? C.sub : C.accent} />
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
                            Score: {c.result.overallScore}% ({c.result.recommendation}) [Preserved]
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {hasScore && (
                    <button
                      title="Clear score & re-screen this resume"
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
                      onClick={() => setCandidates((cs) => cs.map((x) => (x.id === c.id ? { ...x, status: "idle", result: null, error: null } : x)))}
                    >
                      <RotateCcw size={14} color={C.accent} />
                    </button>
                  )}
                  <X size={16} color={C.faint} style={{ cursor: "pointer" }}
                    onClick={() => setCandidates((cs) => cs.filter((x) => x.id !== c.id))} />
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button style={btn("ghost", C)} onClick={onBack}><ArrowLeft size={16} /> Back to role</button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>
          {screenedCount > 0 && (
            <button
              style={btn("soft", C)}
              title={`Force re-evaluate all ${candidates.length} candidates using ${providerLabel}`}
              onClick={() => candidates.length && onRun(true)}
            >
              <RotateCcw size={15} /> Re-analyze All with {providerLabel}
            </button>
          )}

          {unscreenedCount > 0 ? (
            <button
              style={{ ...btn("primary", C), opacity: candidates.length ? 1 : 0.45, cursor: candidates.length ? "pointer" : "not-allowed" }}
              onClick={() => candidates.length && onRun(false)}
            >
              <Sparkles size={16} /> Screen {unscreenedCount} New Resume{unscreenedCount > 1 ? "s" : ""}
            </button>
          ) : (
            <button
              style={{ ...btn("primary", C), opacity: candidates.length ? 1 : 0.45, cursor: candidates.length ? "pointer" : "not-allowed" }}
              onClick={onGotoResults}
            >
              <ArrowRight size={16} /> View Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== STEP 3a: ANALYZING PROGRESS ============================== */
function Analyzing({ candidates, C }) {
  const done = candidates.filter((c) => c.status === "done" || c.status === "error").length;
  const pct = Math.round((done / Math.max(1, candidates.length)) * 100);
  return (
    <Panel title="The AI Agent is screening candidates"
      sub="Reading resume content, evaluating fit against client requirements, and calculating match scores..." C={C}>
      <div style={{ height: 9, background: C.lineSoft, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: C.accent, borderRadius: 6, transition: "width .4s" }} />
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
        {done} of {candidates.length} resumes evaluated
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
                <Check size={14} /> Score: {c.result?.overallScore}%
              </span>
            )}
            {c.status === "error" && (
              <span style={{ fontSize: 12.5, color: REC["Weak Match"].fg, fontWeight: 600 }} title={c.error}>
                Failed: {c.error ? (c.error.length > 50 ? c.error.substring(0, 50) + "..." : c.error) : "Unknown error"}
              </span>
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

/* ============================== STEP 3b: RESULTS & RECOMMENDATIONS ============================== */
function CandidateCard({ rank, c, threshold, jobTitle, onStartInterview, C }) {
  const [open, setOpen] = useState(false);
  const r = c.result;

  if (c.status === "error" || !r) {
    return (
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
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
    <div style={{ background: C.panel, border: `1px solid ${shortlisted ? m.dot : C.line}`, borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 17px", cursor: "pointer" }} onClick={() => setOpen(!open)}>
        <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: C.faint, width: 30 }}>
          {rank}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>{r.candidateName || c.label}</span>
            {shortlisted && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10.5, fontWeight: 800, letterSpacing: ".05em", color: C.accent, background: C.accentSoft, padding: "3px 7px", borderRadius: 5 }}>
                <Star size={11} /> SHORTLISTED
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span>{r.currentTitle} · {r.yearsExperience} yrs exp</span>
            {r.email && r.email !== "N/A" && (
              <>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.faint }} />
                <span style={{ color: C.faint, fontStyle: "italic" }}>{r.email}</span>
              </>
            )}
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: m.dot, lineHeight: 1 }}>
              {r.overallScore}%
            </div>
            <div style={{ fontSize: 9, color: C.faint, fontWeight: 700, letterSpacing: ".04em" }}>RESUME FIT</div>
          </div>
        </div>

        <span style={{ fontSize: 11.5, fontWeight: 700, color: m.fg, background: m.bg, padding: "5px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>
          {r.recommendation}
        </span>
        {open ? <ChevronDown size={18} color={C.faint} /> : <ChevronRight size={18} color={C.faint} />}
      </div>

      <div style={{ padding: "0 17px 13px", fontSize: 13, color: C.sub, lineHeight: 1.5 }}>
        {r.summary}
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${C.lineSoft}`, padding: "16px 17px", background: C.paper, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
          <div>
            <SubHead C={C}>Strengths</SubHead>
            <List items={r.strengths} color={REC["Strong Match"].dot} icon={<Check size={13} />} C={C} />
            <SubHead style={{ marginTop: 14 }} C={C}>Gaps &amp; risks</SubHead>
            <List items={r.gaps} color={REC["Possible Match"].dot} icon={<AlertCircle size={13} />} C={C} />
            {r.missingMustHaves?.length > 0 && (
              <div style={{ marginTop: 12, background: REC["Weak Match"].bg, borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: REC["Weak Match"].fg, letterSpacing: ".04em" }}>MISSING MUST-HAVES</div>
                <div style={{ fontSize: 12.5, color: REC["Weak Match"].fg, marginTop: 3 }}>
                  {r.missingMustHaves.join(", ")}
                </div>
              </div>
            )}
            <SubHead style={{ marginTop: 14 }} C={C}>
              <Lightbulb size={13} style={{ verticalAlign: -2 }} /> Suggested interview questions
            </SubHead>
            <ol style={{ margin: "4px 0 0", paddingLeft: 18, color: C.ink, fontSize: 12.8, lineHeight: 1.6 }}>
               {(r.interviewQuestions || []).map((q, i) => <li key={i} style={{ marginBottom: 3 }}>{q}</li>)}
            </ol>
          </div>

          <div>
            <SubHead C={C}>Fit breakdown</SubHead>
            <div style={{ marginTop: 6 }}>
              <MiniBar label="Skills" value={r.subScores?.skills ?? 0} C={C} />
              <MiniBar label="Experience" value={r.subScores?.experience ?? 0} C={C} />
              <MiniBar label="Education" value={r.subScores?.education ?? 0} C={C} />
              <MiniBar label="Domain fit" value={r.subScores?.domain ?? 0} C={C} />
            </div>
            <div style={{ height: 160, marginTop: 6 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radar} outerRadius={55}>
                  <PolarGrid stroke={C.line} />
                  <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10.5, fill: C.sub }} />
                  <Radar dataKey="v" stroke={m.dot} fill={m.dot} fillOpacity={0.28} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Results({ candidates, job, onReRun, onRestart, onStartInterview, C }) {
  const [threshold, setThreshold] = useState(70);
  const [sortKey, setSortKey] = useState("score");

  const valid = candidates.filter((c) => c.status === "done" && c.result);
  const failed = candidates.filter((c) => c.status === "error" || (c.status === "done" && !c.result));
  
  const sorted = useMemo(() => {
    const arr = [...valid];
    if (sortKey === "score") arr.sort((a, b) => b.result.overallScore - a.result.overallScore);
    if (sortKey === "exp") arr.sort((a, b) => b.result.yearsExperience - a.result.yearsExperience);
    return arr;
  }, [valid, sortKey]);

  const shortlistedCount = sorted.filter((c) => c.result.overallScore >= threshold).length;
  const avgScore = valid.length ? Math.round(valid.reduce((s, c) => s + c.result.overallScore, 0) / valid.length) : 0;

  const handleExportCSV = () => {
    const rows = sorted.map((c, i) => ({
      Rank: i + 1,
      ClientCompany: job.companyName || "Client",
      CandidateName: c.result.candidateName || c.label,
      OverallScore: c.result.overallScore,
      Recommendation: c.result.recommendation,
      Shortlisted: c.result.overallScore >= threshold ? "YES" : "NO",
      Email: c.result.email || "N/A",
      CurrentTitle: c.result.currentTitle,
      YearsExperience: c.result.yearsExperience,
      Education: c.result.education,
      Summary: c.result.summary,
    }));
    downloadCSV(rows, `${(job.title || "shortlist").replace(/\s+/g, "_")}_recommendations.csv`);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 150, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "15px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Candidates Screened</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: C.ink, marginTop: 4 }}>{valid.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 150, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "15px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Shortlisted (≥{threshold}%)</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: "#16A34A", marginTop: 4 }}>{shortlistedCount}</div>
        </div>
        <div style={{ flex: 1, minWidth: 150, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "15px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Average Fit Score</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: gradeColor(avgScore), marginTop: 4 }}>{avgScore}%</div>
        </div>
      </div>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Shortlist Cutoff Score:</span>
          <input type="range" min={30} max={90} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: 140 }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>{threshold}%</span>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={btn("soft", C)} onClick={handleExportCSV}>
            <Download size={15} /> Export Recommendation CSV
          </button>
          <button style={btn("ghost", C)} onClick={onReRun}>
            <RotateCcw size={15} /> Re-screen All
          </button>
        </div>
      </div>

      <div>
        {sorted.map((c, i) => (
          <CandidateCard key={c.id} rank={i + 1} c={c} threshold={threshold} jobTitle={job.title} onStartInterview={onStartInterview} C={C} />
        ))}
      </div>
    </div>
  );
}

/* ============================== SETTINGS VIEW ============================== */
function SettingsView({ llmProvider, setLlmProvider, currentTheme, setTheme, C }) {
  const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem("ANTHROPIC_API_KEY") || "");
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("GEMINI_API_KEY") || "");
  const [groqKey, setGroqKey] = useState(localStorage.getItem("GROQ_API_KEY") || "");
  const [savedMsg, setSavedMsg] = useState("");

  const handleSaveKeys = () => {
    if (anthropicKey) localStorage.setItem("ANTHROPIC_API_KEY", anthropicKey);
    if (geminiKey) localStorage.setItem("GEMINI_API_KEY", geminiKey);
    if (groqKey) localStorage.setItem("GROQ_API_KEY", groqKey);
    setSavedMsg("API Keys saved successfully!");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>Settings &amp; Configuration</h2>
        <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>Configure active LLM providers, API authentication keys, and application themes</p>
      </div>

      <Panel title="Active AI Provider &amp; Model" sub="Select which AI engine screens resumes and conducts AI interviews" C={C}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { id: "groq", name: "Groq API (Llama 3.1 8B)", desc: "Free, ultra-fast performance. Recommended for bulk screening.", badge: "FREE" },
            { id: "gemini", name: "Google Gemini 1.5 Flash", desc: "Fast & affordable. Excellent structured output.", badge: "RECOMMENDED" },
            { id: "claude", name: "Anthropic Claude 3.5 / Sonnet", desc: "Highest precision scoring & vision capabilities for PDFs.", badge: "PAID" },
            { id: "ollama", name: "Local Ollama (Llama 3.1)", desc: "Runs locally on your laptop. Requires Ollama running on localhost.", badge: "LOCAL" },
          ].map(p => (
            <div
              key={p.id}
              onClick={() => setLlmProvider(p.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                borderRadius: 10,
                border: `1.5px solid ${llmProvider === p.id ? C.accent : C.line}`,
                background: llmProvider === p.id ? C.accentSoft : C.bg,
                cursor: "pointer"
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{p.name}</span>
                  <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: C.accent, color: "#FFFFFF", fontWeight: 700 }}>{p.badge}</span>
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{p.desc}</div>
              </div>
              <input type="radio" checked={llmProvider === p.id} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="API Credentials" sub="Keys are stored securely in your local browser storage" C={C}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Groq API Key</label>
            <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..." style={inputStyle(C)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Google Gemini API Key</label>
            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIzaSy..." style={inputStyle(C)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Anthropic Claude API Key</label>
            <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." style={inputStyle(C)} />
          </div>
          <button onClick={handleSaveKeys} style={btn("primary", C)}>
            Save API Keys
          </button>
          {savedMsg && <div style={{ fontSize: 12.5, color: "#16A34A", fontWeight: 700 }}>{savedMsg}</div>}
        </div>
      </Panel>
    </div>
  );
}

/* ============================== MAIN APP COMPONENT ============================== */
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [themeKey, setThemeKey] = useState("light");
  const [companies, setCompanies] = useState(SAMPLE_COMPANIES);
  const [activeCompany, setActiveCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [activeJobId, setActiveJobId] = useState(null);
  const [step, setStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [llmProvider, setLlmProvider] = useState("groq");
  const [activeInterviewCandidate, setActiveInterviewCandidate] = useState(null);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  const C = THEMES[themeKey] || THEMES.light;

  // Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, compRes, logsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/companies"),
          fetch("/api/logs")
        ]);

        if (jobsRes.ok) {
          const jData = await jobsRes.json();
          if (Array.isArray(jData) && jData.length > 0) {
            setJobs(jData);
            if (!activeJobId) setActiveJobId(jData[0].id);
          }
        }

        if (compRes.ok) {
          const cData = await compRes.json();
          if (Array.isArray(cData) && cData.length > 0) setCompanies(cData);
        }

        if (logsRes.ok) {
          const lData = await logsRes.json();
          if (Array.isArray(lData)) setLogs(lData);
        }
      } catch (e) {
        console.error("Failed to load initial backend state:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveJobsToServer = async (jobsList) => {
    try {
      await fetch("/api/save-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs: jobsList })
      });
    } catch (e) {}
  };

  const saveCompaniesToServer = async (compList) => {
    try {
      await fetch("/api/save-companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies: compList })
      });
    } catch (e) {}
  };

  const handleAddCompany = (newComp) => {
    const updated = [newComp, ...companies];
    setCompanies(updated);
    saveCompaniesToServer(updated);
  };

  const handleDeleteCompany = (comp) => {
    const updated = companies.filter(c => c.id !== comp);
    setCompanies(updated);
    saveCompaniesToServer(updated);
  };

  const handleCreateJobForCompany = () => {
    const targetComp = activeCompany || companies[0] || SAMPLE_COMPANIES[0];
    const newId = `job_${Date.now()}`;
    const newJob = {
      id: newId,
      companyId: targetComp.id,
      companyName: targetComp.name,
      title: "",
      seniority: "Senior",
      minYears: 3,
      location: "Chennai / Hybrid",
      description: "",
      mustHave: [],
      niceToHave: [],
      candidates: [],
      screening: "idle"
    };
    const updated = [newJob, ...jobs];
    setJobs(updated);
    saveJobsToServer(updated);
    setActiveJobId(newId);
    setStep(1);
    setMaxReached(1);
    setActiveTab("jobs");
  };

  const handleDeleteJob = (jobId) => {
    const updated = jobs.filter(j => j.id !== jobId);
    setJobs(updated);
    saveJobsToServer(updated);
    if (activeJobId === jobId) {
      setActiveJobId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const activeJob = useMemo(() => jobs.find((j) => j.id === activeJobId), [jobs, activeJobId]);

  const updateActiveJob = (updater) => {
    setJobs((prevJobs) => {
      const updated = prevJobs.map((j) => {
        if (j.id === activeJobId) return updater(j);
        return j;
      });
      saveJobsToServer(updated);
      return updated;
    });
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

  const goto = (n) => { setStep(n); setMaxReached((m) => Math.max(m, n)); };

  const runScreening = async (forceAll = false) => {
    if (!activeJob) return;

    const candidatesToScreen = forceAll
      ? activeJob.candidates
      : activeJob.candidates.filter((c) => c.status !== "done" || !c.result);

    if (candidatesToScreen.length === 0) {
      updateActiveJob((j) => ({ ...j, screening: "done" }));
      goto(3);
      return;
    }

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

        const delayMs = llmProvider === "groq" ? 25000 : 2000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        let resume;
        if (cand.kind === "file") {
          resume = cand.base64
            ? { type: "file", filename: cand.filename, base64: cand.base64 }
            : { type: "db", candidateId: cand.id };
        } else {
          resume = { type: "text", text: cand.text || "" };
        }

        const { candidates: _, ...jobCriteria } = activeJob;

        try {
          const result = await analyzeCandidate(jobCriteria, resume, llmProvider);
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
      console.error("Screening failed:", e);
    }

    updateActiveJob((j) => ({ ...j, screening: "done" }));
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: BODY }}>
      {/* Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTheme={themeKey}
        setTheme={setThemeKey}
        companies={companies}
        activeCompany={activeCompany}
        setActiveCompany={setActiveCompany}
        C={C}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "28px 36px", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box", overflowX: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <Loader2 className="spin" size={40} color={C.accent} />
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <WelcomeDashboard
                companies={companies}
                jobs={jobs}
                activeCompany={activeCompany}
                setActiveCompany={setActiveCompany}
                onCreateCompany={() => setShowAddCompanyModal(true)}
                onCreateJob={handleCreateJobForCompany}
                onSelectJob={(jId) => { setActiveJobId(jId); setActiveTab("jobs"); setStep(3); }}
                C={C}
              />
            )}

            {activeTab === "companies" && (
              <CompanyManager
                companies={companies}
                jobs={jobs}
                onCreateCompany={() => setShowAddCompanyModal(true)}
                onDeleteCompany={handleDeleteCompany}
                onSelectCompanyJobs={(comp) => { setActiveCompany(comp); setActiveTab("jobs"); }}
                C={C}
              />
            )}

            {activeTab === "logs" && (
              <ActivityLogsView logs={logs} C={C} />
            )}

            {activeTab === "settings" && (
              <SettingsView
                llmProvider={llmProvider}
                setLlmProvider={setLlmProvider}
                currentTheme={themeKey}
                setTheme={setThemeKey}
                C={C}
              />
            )}

            {activeTab === "jobs" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
                      {activeCompany ? `Openings for ${activeCompany.name}` : "All Client Openings & Resume Screening"}
                    </h2>
                    <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>Upload job descriptions and candidate resumes for automated AI shortlisting</p>
                  </div>
                  <button
                    onClick={handleCreateJobForCompany}
                    style={btn("primary", C)}
                  >
                    + Post New Opening Job
                  </button>
                </div>

                {jobs.length === 0 ? (
                  <Panel C={C}>
                    <div style={{ textAlign: "center", padding: "40px 0", color: C.sub }}>
                      No openings posted yet. Click "+ Post New Opening Job" to start.
                    </div>
                  </Panel>
                ) : (
                  <div>
                    {/* Job Selection Tabs */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
                      {jobs.map(j => (
                        <div
                          key={j.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: `1px solid ${activeJobId === j.id ? C.accent : C.line}`,
                            background: activeJobId === j.id ? C.accentSoft : C.paper,
                            color: activeJobId === j.id ? C.accent : C.ink,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            fontFamily: BODY,
                          }}
                          onClick={() => { setActiveJobId(j.id); setStep(1); }}
                        >
                          <span>🏢 {j.companyName} — {j.title || "Untitled Opening"}</span>
                          <Trash2
                            size={14}
                            color={C.faint}
                            style={{ cursor: "pointer", opacity: 0.7 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteJob(j.id);
                            }}
                            title="Delete this job opening"
                          />
                        </div>
                      ))}
                    </div>

                    {activeJob && (
                      <div style={{ marginBottom: 20 }}>
                        {/* Stepper Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <Stepper step={step} maxReached={maxReached} go={goto} C={C} />
                          <button
                            onClick={() => handleDeleteJob(activeJob.id)}
                            style={{
                              padding: "6px 12px",
                              background: "#FEE2E2",
                              color: "#DC2626",
                              border: "1px solid #FCA5A5",
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontFamily: BODY,
                            }}
                          >
                            <Trash2 size={14} /> Delete Job Opening
                          </button>
                        </div>

                        {/* Step Views */}
                        {step === 1 && (
                          <RoleStep
                            job={activeJob}
                            setJob={handleUpdateJobDetails}
                            companies={companies}
                            onNext={() => goto(2)}
                            C={C}
                          />
                        )}

                        {step === 2 && (
                          <CandidateStep
                            candidates={activeJob.candidates || []}
                            setCandidates={handleUpdateCandidates}
                            onBack={() => goto(1)}
                            onRun={(force) => runScreening(force)}
                            onGotoResults={() => goto(3)}
                            llmProvider={llmProvider}
                            C={C}
                          />
                        )}

                        {step === 3 && activeJob.screening === "running" && (
                          <Analyzing candidates={activeJob.candidates || []} C={C} />
                        )}

                        {step === 3 && activeJob.screening === "done" && (
                          <Results
                            candidates={activeJob.candidates || []}
                            job={activeJob}
                            onReRun={() => runScreening(true)}
                            onRestart={() => goto(1)}
                            onStartInterview={(cand) => setActiveInterviewCandidate(cand)}
                            C={C}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Company Modal */}
      {showAddCompanyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.paper, borderRadius: 14, padding: 24, width: 440, maxWidth: "90%", border: `1px solid ${C.cardBorder}` }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px", color: C.ink, fontFamily: DISPLAY }}>Add New Client Company</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              const newC = {
                id: `comp_${Date.now()}`,
                name: form.name.value,
                industry: form.industry.value || "General",
                contactEmail: form.email.value || "",
                notes: form.notes.value || "",
                createdAt: new Date().toISOString()
              };
              handleAddCompany(newC);
              setShowAddCompanyModal(false);
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Company Name *</label>
                  <input name="name" required placeholder="e.g. Motherson Group" style={inputStyle(C)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Industry</label>
                  <input name="industry" placeholder="e.g. Automotive & Manufacturing" style={inputStyle(C)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>HR / Contact Email</label>
                  <input name="email" type="email" placeholder="hr@clientcompany.com" style={inputStyle(C)} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Notes / Guidelines</label>
                  <textarea name="notes" placeholder="Specific hiring guidelines for this company..." style={{ ...inputStyle(C), minHeight: 60 }} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 }}>
                  <button type="button" onClick={() => setShowAddCompanyModal(false)} style={btn("ghost", C)}>Cancel</button>
                  <button type="submit" style={btn("primary", C)}>Save Company</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
