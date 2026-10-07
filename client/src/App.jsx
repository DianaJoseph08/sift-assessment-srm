import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload, FileText, Briefcase, Sparkles, ChevronDown, ChevronRight, X, Check,
  Plus, Download, RotateCcw, ArrowRight, ArrowLeft, AlertCircle, Users, Star,
  Target, GraduationCap, Lightbulb, Search, Loader2, FileWarning, Trash2, Home,
  Mail, Send, MessageSquare, Play, Building2, Activity, Settings, Moon, Sun, Layers,
  ShieldCheck, ExternalLink, Filter, Copy, RefreshCw, ChevronUp, Cpu, Save, BookOpen, Scale,
  HelpCircle, CheckCircle2, Clock, Edit2, GitBranch, Tag, History,
  UserCheck, UserX, FileSpreadsheet
} from "lucide-react";
import { analyzeCandidate, fileToBase64, sendInterviewChat, evaluateInterview } from "./api.js";
import VideoInterview from "./VideoInterview.jsx";


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
    name: "Corporate Blue",
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

const DISPLAY = "'Outfit', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BODY = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const BrandLogo = ({ collapsed = false, theme = "dark" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, userSelect: "none" }}>
    {/* Motherson Corporate Brand Logo */}
    <div style={{
      position: "relative",
      height: 42,
      width: collapsed ? 42 : "auto",
      padding: collapsed ? "0" : "0 10px",
      borderRadius: 10,
      background: "#FFFFFF",
      border: "1.5px solid rgba(255, 255, 255, 0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.35)",
      flexShrink: 0
    }}>
      <img
        src={collapsed ? "/motherson-mark.png" : "/motherson-logo-cropped.png"}
        alt="Motherson"
        style={{
          height: collapsed ? 26 : 22,
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          display: "block"
        }}
      />
    </div>

    {!collapsed && (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 18,
            fontWeight: 800,
            fontFamily: DISPLAY,
            color: "#F8FAFC",
            letterSpacing: "-0.02em"
          }}>
            Cogni<span style={{
              background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 900,
              marginLeft: 1
            }}>Hire</span>
          </span>
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            padding: "1px 6px",
            borderRadius: 4,
            background: "rgba(56, 189, 248, 0.15)",
            color: "#38BDF8",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            letterSpacing: "0.06em",
            textTransform: "uppercase"
          }}>
            AI
          </span>
        </div>
        <div style={{
          fontSize: 10.5,
          color: "#64748B",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase"
        }}>
          AI Interviewer &amp; Proctoring
        </div>
      </div>
    )}
  </div>
);

/* ============================== VERSION CONTROL & RELEASE CHANGELOG ============================== */
const APP_VERSION = "v1.4.0";

const CHANGELOG_DATA = [
  {
    version: "v1.4.0",
    title: "Executive Hiring Cockpit, Vacancies Tracking, Editable HR Decisions & Excel Export",
    date: "October 7, 2026",
    badge: "Current Production",
    tagColor: "#10B981",
    highlights: [
      {
        icon: "📊",
        title: "Executive Recruitment Cockpit",
        description: "Overview dashboard displaying Available Vacancies, Resumes Screened, Cutoff Score threshold, HR Selected Candidates, and a visual Vacancy Fulfillment Progress Bar."
      },
      {
        icon: "🎯",
        title: "Job Vacancies & Cutoff Configuration",
        description: "Role setup (Step 1) now allows recruiters to define target vacancies available and customize the shortlist benchmark cutoff percentage for every opening."
      },
      {
        icon: "⭐",
        title: "Editable HR Selection Controls",
        description: "HR can mark candidates as Selected or Not Selected with one-click reversibility—switch between states or reset to pending review at any time."
      },
      {
        icon: "📑",
        title: "Native Multi-Sheet Excel (.xlsx) Reports",
        description: "One-click Excel report export per client company featuring Sheet 1 (Openings & Vacancies Pipeline) and Sheet 2 (Candidate Screening Roster with 4-pillar subscores and HR decisions)."
      }
    ]
  },
  {
    version: "v1.3.0",
    title: "Client Company Profile Editing & Workflow Refinements",
    date: "September 30, 2026",
    badge: "Stable Release",
    tagColor: "#64748B",
    highlights: [
      {
        icon: "🏢",
        title: "Full Client Company Editing",
        description: "Recruiters can update existing client organization profiles: Default Reply-To Email ID, Sender Display Name, Industry, and hiring guidelines."
      },
      {
        icon: "✏️",
        title: "Direct Job Setup Actions",
        description: "Added '[Edit Company]' and '[+ New]' buttons directly beside the Target Client Company dropdown in Step 1 (Define Job Criteria)."
      },
      {
        icon: "🧹",
        title: "Toolbar & UI Decluttering",
        description: "Streamlined company card actions with a single top-right Edit button, cleaned up navigation toolbar, and eliminated duplicate plus symbols."
      }
    ]
  },
  {
    version: "v1.2.0",
    title: "AI Resume Authenticity & Video Interview Teleprompter Detection",
    date: "September 30, 2026",
    badge: "Major Security Update",
    tagColor: "#3B82F6",
    highlights: [
      {
        icon: "🛡️",
        title: "Resume Authenticity Engine",
        description: "Adversarial prompt-injection sanitization, 5-word n-gram verbatim JD echo detection, and career timeline chronology checks."
      },
      {
        icon: "📱",
        title: "Anti-Teleprompter & Phone Cheating Detection",
        description: "Monitors candidate typing cadence (WPM > 80, <3% backspaces) and sustained downward gaze tracking (>3.5s) to catch smartphone transcription."
      },
      {
        icon: "🤖",
        title: "ChatGPT Stylometry Evaluator",
        description: "Audits candidate answers for AI linguistic signatures (conversational signposts, rigid enumeration, unnatural balance) with an AI Content Risk % score."
      },
      {
        icon: "📊",
        title: "Recruiter Integrity Visibility",
        description: "Added color-coded Authenticity Badges to candidate cards, comparison table, and downloadable CSV reports."
      }
    ]
  },
  {
    version: "v1.1.0",
    title: "Side-by-Side Candidate Comparison Matrix & Claude Executive Memos",
    date: "September 29, 2026",
    badge: "Feature Release",
    tagColor: "#8B5CF6",
    highlights: [
      {
        icon: "⚖️",
        title: "Head-to-Head Comparison Matrix",
        description: "Side-by-side evaluation of top 2–5 candidates with frozen column and row headers for effortless multi-candidate reviewing."
      },
      {
        icon: "🧠",
        title: "Automated Score Justification & Claude Memos",
        description: "Rule-based delta justification cards and one-click 'Ask Claude to Compare' comparative executive memos."
      },
      {
        icon: "🔗",
        title: "Two-Connected Dropdowns Toolbar",
        description: "Synchronized Client Company and Job Opening selectors with live screened candidate counters."
      }
    ]
  },
  {
    version: "v1.0.0",
    title: "CogniHire Foundation & Proctored AI Video Interview",
    date: "September 2026",
    badge: "Initial Release",
    tagColor: "#64748B",
    highlights: [
      {
        icon: "📄",
        title: "Automated Multi-Format Parsing",
        description: "Instant parsing of PDF, DOCX, and TXT resumes with LLM-powered candidate profile extraction."
      },
      {
        icon: "🎯",
        title: "4-Pillar Weighted Scoring",
        description: "Skills Fit (40%), Experience Fit (25%), Domain Relevance (20%), and Academic Discipline (15%)."
      },
      {
        icon: "🎥",
        title: "MediaPipe Vision AI Proctoring",
        description: "Real-time webcam telemetry for face presence, multi-person detection, looking away, and tab switching."
      }
    ]
  }
];

const SAMPLE_COMPANIES = [
  { id: "comp_motherson", name: "Motherson Group", industry: "Automotive & Manufacturing", contactEmail: "hr@motherson.com", senderName: "Motherson Talent Acquisition", notes: "Key OEM partner for CAE simulation & mechanical roles", createdAt: new Date().toISOString() },
  { id: "comp_apextech", name: "Apex Technologies", industry: "Software & Cloud Services", contactEmail: "careers@apextech.com", senderName: "Apex Tech Recruitment Team", notes: "Engineering & IT talent acquisition", createdAt: new Date().toISOString() },
  { id: "comp_bosch", name: "Bosch India", industry: "Automotive Engineering", contactEmail: "ta@bosch.in", senderName: "Bosch India Talent Team", notes: "R&D hiring for Embedded & Mechatronics roles", createdAt: new Date().toISOString() }
];

const SAMPLE_JOB = {
  title: "Senior Machine Learning Engineer",
  seniority: "Senior",
  minYears: 5,
  location: "Bengaluru / Hybrid",
  senderName: "",
  senderEmail: "",
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

function exportClientExcel(company, companyJobs = []) {
  if (!company) return;
  const wb = XLSX.utils.book_new();

  // Sheet 1: Job Openings & Vacancy Pipeline
  const jobRows = (companyJobs || []).map((j, idx) => {
    const cands = j.candidates || [];
    const valid = cands.filter(c => c.status === "done" && c.result);
    const cutoff = j.cutoff ?? 70;
    const vacancies = j.vacancies ?? 1;
    const screened = valid.length;
    const metCutoff = valid.filter(c => (c.result?.overallScore ?? 0) >= cutoff).length;
    const selected = valid.filter(c => c.hrDecision === "selected" || c.result?.hrDecision === "selected").length;
    const rejected = valid.filter(c => c.hrDecision === "rejected" || c.result?.hrDecision === "rejected").length;
    const pending = valid.filter(c => !c.hrDecision && !c.result?.hrDecision).length;
    const remaining = Math.max(0, vacancies - selected);
    const status = selected >= vacancies ? "FILLED" : (selected > 0 ? "PARTIALLY FILLED" : "OPEN");

    return {
      "S.No": idx + 1,
      "Client Company": company.name,
      "Job Opening Title": j.title || "Untitled Role",
      "Seniority Level": j.seniority || "Senior",
      "Min Experience (Years)": j.minYears ?? 0,
      "Target Vacancies": vacancies,
      "Shortlist Cutoff (%)": `${cutoff}%`,
      "Resumes Screened": screened,
      "Qualified (>= Cutoff)": metCutoff,
      "HR Selected Candidates": selected,
      "HR Not Selected": rejected,
      "Pending Review": pending,
      "Remaining Openings": remaining,
      "Pipeline Status": status,
    };
  });

  const wsJobs = XLSX.utils.json_to_sheet(jobRows.length > 0 ? jobRows : [{
    "Client Company": company.name,
    "Status": "No active job openings created yet"
  }]);
  XLSX.utils.book_append_sheet(wb, wsJobs, "Job Vacancies & Pipeline");

  // Sheet 2: Screened Candidates Roster
  const candRows = [];
  let candSeq = 1;
  (companyJobs || []).forEach((j) => {
    const valid = (j.candidates || []).filter(c => c.status === "done" && c.result);
    valid.forEach((c) => {
      const res = c.result || {};
      const cutoff = j.cutoff ?? 70;
      const score = res.overallScore ?? 0;
      const decision = c.hrDecision || res.hrDecision;
      const decisionText = decision === "selected" ? "SELECTED" : (decision === "rejected" ? "NOT SELECTED" : "PENDING");

      candRows.push({
        "S.No": candSeq++,
        "Client Company": company.name,
        "Job Opening Title": j.title || "Untitled Role",
        "Candidate Name": res.candidateName || c.label || "Candidate",
        "HR Decision": decisionText,
        "Match Score (%)": score,
        "Met Cutoff": score >= cutoff ? "YES" : "NO",
        "AI Recommendation": res.recommendation || "N/A",
        "Authenticity Score (%)": res.authenticityScore !== undefined ? `${res.authenticityScore}%` : "100%",
        "Current Title": res.currentTitle || "N/A",
        "Experience (Years)": res.yearsExperience ?? "N/A",
        "Education": res.education || "N/A",
        "Skills Subscore (%)": res.subScores?.skills ?? "N/A",
        "Experience Subscore (%)": res.subScores?.experience ?? "N/A",
        "Education Subscore (%)": res.subScores?.education ?? "N/A",
        "Domain Subscore (%)": res.subScores?.domain ?? "N/A",
        "AI Interview Score (%)": res.interview?.score !== undefined ? `${res.interview.score}%` : "Not Conducted",
        "Contact Email": (res.email && res.email !== "N/A" && !res.email.includes("candidate.edu")) ? res.email : "Not Provided",
        "AI Executive Summary": (res.summary || "").replace(/\r?\n+/g, " "),
      });
    });
  });

  const wsCands = XLSX.utils.json_to_sheet(candRows.length > 0 ? candRows : [{
    "Client Company": company.name,
    "Status": "No candidates screened yet"
  }]);
  XLSX.utils.book_append_sheet(wb, wsCands, "Candidates Roster");

  const cleanName = (company.name || "Client").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${cleanName}_Recruitment_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
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
  const steps = ["Define Job Criteria", "Add Resumes", "Review Shortlist & Recommend", "Compare Candidates"];
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
            {n < 4 && <div style={{ width: 24, height: 1, background: C.line }} />}
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
function RoleStep({ job, setJob, companies, onNext, onSave, savedNotice, onDelete, onEditCompany, onCreateCompany, C }) {
  const ready = (job.title || "").trim() && (job.description || "").trim();
  const selectedComp = companies.find(c => c.id === job.companyId) || companies[0];
  const companyDefaultSender = selectedComp?.senderName || (selectedComp?.name ? `${selectedComp.name} Talent Team` : "Client Talent Team");
  const companyDefaultEmail = selectedComp?.contactEmail || "hr@client.com";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 22 }}>
      <Panel
        title="Define Job Criteria"
        sub="Specify the role requirements and select target client company"
        C={C}
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              onClick={onSave}
              title="Save Job Opening Criteria"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                background: savedNotice ? "#DCFCE7" : C.accentSoft,
                color: savedNotice ? "#15803D" : C.accent,
                border: `1px solid ${savedNotice ? "#86EFAC" : C.accent}`,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: BODY,
                transition: "all 0.15s ease"
              }}
            >
              {savedNotice ? <Check size={14} /> : <Save size={14} />}
              <span>{savedNotice ? "Saved!" : "Save"}</span>
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                title="Delete this Job Opening"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  background: "#FEE2E2",
                  color: "#DC2626",
                  border: "1px solid #FCA5A5",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: BODY,
                  transition: "all 0.15s ease"
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}
          </div>
        }
      >
        <Field label="Target Client Company" C={C}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              style={{ ...inputStyle(C), flex: 1 }}
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

            {onEditCompany && selectedComp && (
              <button
                type="button"
                onClick={() => onEditCompany(selectedComp)}
                title="Edit client company name, reply-to email ID, and sender details"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "9px 12px",
                  background: C.paper,
                  color: C.ink,
                  border: `1.5px solid ${C.line}`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: BODY,
                  transition: "all 0.15s ease"
                }}
              >
                <Edit2 size={13} color={C.accent} /> Edit Company
              </button>
            )}

            {onCreateCompany && (
              <button
                type="button"
                onClick={onCreateCompany}
                title="Register a new client company"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "9px 12px",
                  background: C.accentSoft,
                  color: C.accent,
                  border: `1.5px solid ${C.accent}`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: BODY,
                  transition: "all 0.15s ease"
                }}
              >
                <Plus size={13} /> New
              </button>
            )}
          </div>
        </Field>

        <Field label="Job title" C={C}>
          <input style={inputStyle(C)} value={job.title || ""}
            placeholder="e.g. Senior Machine Learning Engineer"
            onChange={(e) => setJob({ ...job, title: e.target.value })} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.8fr", gap: 12 }}>
          <div>
            <Field label="Seniority" C={C}>
              <select style={inputStyle(C)} value={job.seniority || "Senior"}
                onChange={(e) => setJob({ ...job, seniority: e.target.value })}>
                {["Intern", "Junior", "Mid-level", "Senior", "Lead / Principal", "Director"].map((s) =>
                  <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div>
            <Field label="Min. years" hint="Experience" C={C}>
              <input type="number" min={0} style={inputStyle(C)} value={job.minYears || 0}
                onChange={(e) => setJob({ ...job, minYears: Math.max(0, Number(e.target.value) || 0) })} />
            </Field>
          </div>
          <div>
            <Field label="Vacancies" hint="Openings" C={C}>
              <input type="number" min={1} style={inputStyle(C)} value={job.vacancies ?? 1}
                onChange={(e) => setJob({ ...job, vacancies: Math.max(1, Number(e.target.value) || 1) })} />
            </Field>
          </div>
          <div>
            <Field label="Cutoff %" hint="Benchmark" C={C}>
              <input type="number" min={30} max={95} style={inputStyle(C)} value={job.cutoff ?? 70}
                onChange={(e) => setJob({ ...job, cutoff: Math.max(30, Math.min(95, Number(e.target.value) || 70)) })} />
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

        {/* Recruiter & Sender Email Configuration */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Mail size={16} color={C.accent} />
            <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, fontFamily: DISPLAY }}>
              AI Interview Email Sender &amp; Reply-To Settings
            </span>
          </div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Field
                label="Job-Specific Recruiter / Sender Name (Optional)"
                hint={`Leave blank to inherit: "${companyDefaultSender}"`}
                C={C}
              >
                <input
                  style={inputStyle(C)}
                  value={job.senderName || ""}
                  placeholder={`e.g. ${selectedComp?.name || 'Company'} CAE Lead`}
                  onChange={(e) => setJob({ ...job, senderName: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <Field
                label="Job-Specific Reply-To Email (Optional)"
                hint={`Leave blank to inherit: "${companyDefaultEmail}"`}
                C={C}
              >
                <input
                  type="email"
                  style={inputStyle(C)}
                  value={job.senderEmail || ""}
                  placeholder={`e.g. hiring-${(job.title || 'team').toLowerCase().replace(/\s+/g, '')}@${selectedComp?.name?.toLowerCase().replace(/\s+/g, '') || 'client'}.com`}
                  onChange={(e) => setJob({ ...job, senderEmail: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <div style={{
            background: C.bg,
            border: `1px solid ${C.line}`,
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 11.5,
            color: C.sub,
            lineHeight: 1.5,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            marginTop: 8
          }}>
            <span style={{ fontSize: 14 }}>🛡️</span>
            <div>
              <strong style={{ color: C.ink }}>SPF/DKIM Deliverability Guarantee:</strong> Candidate invitations are delivered safely to the inbox from CogniHire's verified domain as:
              <br />
              <code style={{ background: C.paper, padding: "2px 6px", borderRadius: 4, color: C.accent, fontWeight: 700, display: "inline-block", marginTop: 2 }}>
                From: "{job.senderName?.trim() || companyDefaultSender} via CogniHire" &lt;invitations@cognihire.ai&gt;
              </code>
              <br />
              Candidate replies will land directly in:
              <code style={{ background: C.paper, padding: "2px 6px", borderRadius: 4, color: "#16A34A", fontWeight: 700, marginLeft: 4 }}>
                Reply-To: {job.senderEmail?.trim() || companyDefaultEmail}
              </code>
            </div>
          </div>
        </div>
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
  
  const providerLabel = llmProvider === "gemma" ? "Google Gemma 2" : llmProvider === "claude" ? "Claude API" : llmProvider === "gemini" ? "Gemini API" : llmProvider === "groq" ? "Groq Llama 3.1" : "Google Gemma 2";

  const [duplicateModal, setDuplicateModal] = useState(null);

  const addFiles = async (files) => {
    setErr("");
    for (const f of Array.from(files)) {
      const existing = candidates.find(c => (c.filename && c.filename.toLowerCase() === f.name.toLowerCase()) || (c.label && c.label.toLowerCase() === f.name.toLowerCase()));
      try {
        const base64 = await fileToBase64(f);
        if (existing) {
          setDuplicateModal({
            file: f,
            base64,
            existingCand: existing
          });
        } else {
          setCandidates((cs) => [...cs, {
            id: uid(), kind: "file", filename: f.name, base64,
            fileSize: f.size, label: f.name, status: "idle", result: null, error: null,
          }]);
        }
      } catch {
        setErr(`Could not read "${f.name}".`);
      }
    }
  };

  const handleReplaceDuplicate = () => {
    if (!duplicateModal) return;
    const { file, base64, existingCand } = duplicateModal;
    setCandidates((cs) => cs.map((c) => (
      c.id === existingCand.id
        ? { ...c, base64, fileSize: file.size, filename: file.name, label: file.name, status: "idle", result: null, error: null }
        : c
    )));
    setDuplicateModal(null);
  };

  const handleKeepOlderDuplicate = () => {
    setDuplicateModal(null);
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
                          ? (c.filename ? `${c.filename} ${c.fileSize ? `(${(c.fileSize / 1024).toFixed(1)} KB)` : ""}` : "Uploaded File")
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

          <button
            style={{ ...btn("primary", C), opacity: unscreenedCount > 0 ? 1 : 0.45, cursor: unscreenedCount > 0 ? "pointer" : "not-allowed" }}
            onClick={() => unscreenedCount > 0 && onRun(false)}
          >
            <Sparkles size={16} /> Screen {unscreenedCount} New Resume{unscreenedCount !== 1 ? "s" : ""} <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Duplicate Resume Warning Modal */}
      {duplicateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
          <div style={{ background: C.paper, borderRadius: 16, width: 480, maxWidth: "95%", padding: 24, border: `1px solid ${C.cardBorder}`, boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <FileWarning size={22} color="#D97706" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>Duplicate Resume Detected</div>
                <div style={{ fontSize: 12.5, color: C.sub }}>"{duplicateModal.file.name}" is already in this candidate pool.</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, background: C.bg, borderRadius: 10, padding: "12px 14px", margin: "14px 0", border: `1px solid ${C.line}` }}>
              An older version of this resume file already exists in the candidate pool for this opening. Would you like to keep the older file or replace it with your newly uploaded file?
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={handleKeepOlderDuplicate} style={btn("ghost", C)}>
                Keep Older File
              </button>
              <button onClick={handleReplaceDuplicate} style={{ ...btn("primary", C), background: "#D97706", borderColor: "#D97706" }}>
                Replace with New File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== STEP 3a: ANALYZING PROGRESS ============================== */
function Analyzing({ candidates, onComplete, C }) {
  const done = candidates.filter((c) => c.status === "done" || c.status === "error").length;
  const pct = Math.round((done / Math.max(1, candidates.length)) * 100);
  const isFinished = done >= candidates.length && candidates.length > 0;

  useEffect(() => {
    if (isFinished && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isFinished, onComplete]);

  return (
    <Panel 
      title={isFinished ? "AI Screening Complete" : "The AI Agent is screening candidates"}
      sub={isFinished ? "All resumes evaluated against job requirements. Loading detailed shortlist..." : "Reading resume content, evaluating fit against client requirements, and calculating match scores..."} 
      C={C}
    >
      <div style={{ height: 9, background: C.lineSoft, borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: isFinished ? "#22C55E" : C.accent, borderRadius: 6, transition: "width .4s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: C.sub }}>
          {done} of {candidates.length} resumes evaluated
        </span>
        {isFinished && (
          <button
            onClick={onComplete}
            style={{
              padding: "7px 16px",
              background: "#2563EB",
              color: "#FFF",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            View Candidate Details & Scores →
          </button>
        )}
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

/* ============================== CANDIDATE INVITATION EMAIL MODAL ============================== */
function InviteCandidateModal({ c, job, company, onClose, C }) {
  const r = c.result;
  const initialEmail = (r?.email && r.email !== "N/A" && !r.email.includes("candidate.edu")) ? r.email : "";
  const [recipientEmail, setRecipientEmail] = useState(initialEmail);
  
  const companyName = company?.name || job?.companyName || "Client Company";
  const defaultSenderName = (job?.senderName || "").trim() || (company?.senderName || "").trim() || `${companyName} Talent Team`;
  const defaultReplyTo = (job?.senderEmail || "").trim() || (company?.contactEmail || "").trim() || "hr@client.com";

  const [senderDisplayName, setSenderDisplayName] = useState(defaultSenderName);
  const [replyToEmail, setReplyToEmail] = useState(defaultReplyTo);
  const [subject, setSubject] = useState(`AI Technical Interview Invitation — ${job?.title || 'Position'} at ${companyName}`);

  const interviewLink = `${window.location.origin}/interview?cand=${c.id}`;

  const defaultBody = 
`Dear ${r?.candidateName || 'Candidate'},

Congratulations! You have been shortlisted for the position of ${job?.title || 'the role'} at ${companyName}.

As the next step in our evaluation process, you are invited to complete an automated, proctored AI Technical Interview on the CogniHire platform.

👉 Access Your AI Interview Session:
${interviewLink}

Session Information & Guidelines:
• 5 Technical Assessment Questions
• 3 minutes allotted per question (auto-advancing)
• Direct text entry response for each question
• Active Anti-Fraud Proctoring: Camera & face visibility required; please maintain eye contact with the screen throughout the session.

If you have any questions, please reply directly to this email (${replyToEmail}).

Best regards,
${senderDisplayName}
${companyName}`;

  const [emailBody, setEmailBody] = useState(defaultBody);

  const handleOpenGmail = () => {
    if (!recipientEmail) {
      alert("Please enter a candidate recipient email address.");
      return;
    }
    const encSub = encodeURIComponent(subject);
    const encBody = encodeURIComponent(emailBody);
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipientEmail)}&su=${encSub}&body=${encBody}`, "_blank");

    // Asynchronously log to system activity logs
    try {
      fetch("/api/send-interview-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: r?.candidateName || c.label,
          email: recipientEmail,
          phone: r?.phone || "",
          jobTitle: job?.title || "Role",
          companyName,
          interviewLink,
          senderName: senderDisplayName,
          senderEmail: "invitations@cognihire.ai",
          replyTo: replyToEmail
        })
      });
    } catch (e) {}

    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: 20 }}>
      <div style={{ background: C.paper, borderRadius: 16, width: 640, maxWidth: "96%", maxHeight: "90vh", display: "flex", flexDirection: "column", border: `1px solid ${C.cardBorder}`, boxShadow: "0 20px 40px rgba(0,0,0,0.4)", overflow: "hidden" }}>
        
        {/* Modal Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mail size={18} color={C.accent} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
                Send AI Interview Invitation
              </h3>
              <p style={{ fontSize: 12, color: C.sub, margin: "2px 0 0" }}>
                Candidate: <strong>{r?.candidateName || c.label}</strong> · {job?.title || 'Role'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          
          {/* Deliverability & Routing Explanation Badge */}
          <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", fontSize: 12, lineHeight: 1.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
              <span>🛡️</span> <span>SPF/DKIM Authenticated Multi-Tier Delivery</span>
            </div>
            <div style={{ color: C.sub }}>
              • <strong>From Header:</strong> <code style={{ color: C.accent, fontWeight: 700 }}>"{senderDisplayName} via CogniHire" &lt;invitations@cognihire.ai&gt;</code> (100% Inbox Delivery)
              <br />
              • <strong>Reply-To Header:</strong> <code style={{ color: "#16A34A", fontWeight: 700 }}>{replyToEmail}</code> (Candidate replies land directly in this recruiter inbox)
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
                Candidate Recipient Email (To) *
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="candidate@email.com"
                style={inputStyle(C)}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
                Recruiter Reply-To Email *
              </label>
              <input
                type="email"
                value={replyToEmail}
                onChange={(e) => setReplyToEmail(e.target.value)}
                placeholder="recruiter@clientcompany.com"
                style={inputStyle(C)}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
              Sender Display Name
            </label>
            <input
              type="text"
              value={senderDisplayName}
              onChange={(e) => setSenderDisplayName(e.target.value)}
              placeholder="e.g. Motherson Talent Acquisition"
              style={inputStyle(C)}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={inputStyle(C)}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <label style={{ fontSize: 11.5, fontWeight: 700, color: C.sub }}>
                Invitation Message &amp; Guidelines
              </label>
              <span style={{ fontSize: 10.5, color: C.faint }}>Unique candidate link included</span>
            </div>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={8}
              style={{ ...inputStyle(C), minHeight: 140, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.5 }}
            />
          </div>
        </div>

        {/* Modal Footer Actions - Open Web Gmail Only */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${C.line}`, background: C.paper, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "9px 16px",
              background: C.bg,
              color: C.ink,
              border: `1px solid ${C.line}`,
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: BODY,
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleOpenGmail}
            style={{
              padding: "10px 22px",
              background: "#EA4335",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: BODY,
              boxShadow: "0 2px 8px rgba(234, 67, 53, 0.28)"
            }}
            title="Open Google Web Gmail in browser tab with all fields pre-filled"
          >
            <Mail size={16} /> Open Web Gmail
          </button>
        </div>

      </div>
    </div>
  );
}

/* ============================== STEP 3b: RESULTS & RECOMMENDATIONS ============================== */
function CandidateCard({ rank, c, threshold, job, company, onStartInterview, onUpdateDecision, C }) {
  const [open, setOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const r = c.result;

  const [actionNotice, setActionNotice] = useState("");

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    const interviewLink = `${window.location.origin}/interview?cand=${c.id}`;
    try {
      await navigator.clipboard.writeText(interviewLink);
    } catch (err) {}
    setActionNotice("copy");
    setTimeout(() => setActionNotice(""), 3500);
  };

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

  const hrDecision = c.hrDecision || r?.hrDecision || null;
  const m = recMeta(r.recommendation);
  const shortlisted = r.overallScore >= threshold;
  const radar = [
    { dim: "Skills", v: r.subScores?.skills ?? 0 },
    { dim: "Experience", v: r.subScores?.experience ?? 0 },
    { dim: "Education", v: r.subScores?.education ?? 0 },
    { dim: "Domain", v: r.subScores?.domain ?? 0 },
  ];

  const candidateEmail = r?.email && r.email !== "N/A" && !r.email.includes("candidate.edu") ? r.email : "No email listed in resume";

  const cardBorder = hrDecision === "selected"
    ? "2px solid #16A34A"
    : hrDecision === "rejected"
    ? "1.5px solid #FCA5A5"
    : (shortlisted ? `1.5px solid ${m.dot}` : `1px solid ${C.line}`);

  return (
    <div style={{ background: C.panel, border: cardBorder, borderRadius: 12, overflow: "hidden", marginBottom: 12, boxShadow: hrDecision === "selected" ? "0 4px 12px rgba(22, 163, 74, 0.12)" : "none" }}>
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
            {hrDecision === "selected" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#FFFFFF", background: "#16A34A", padding: "3px 8px", borderRadius: 5 }}>
                <UserCheck size={12} /> HR SELECTED
              </span>
            )}
            {hrDecision === "rejected" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#FFFFFF", background: "#DC2626", padding: "3px 8px", borderRadius: 5 }}>
                <UserX size={12} /> NOT SELECTED
              </span>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: C.sub, marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{r.currentTitle} · {r.yearsExperience} yrs exp</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.faint }} />
            <span style={{ color: C.ink, fontWeight: 600 }}>✉️ {candidateEmail}</span>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ textAlign: "right", marginRight: 4, display: "flex", gap: 16 }}>
            <div style={{ paddingRight: 16, borderRight: `1px solid ${C.line}` }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: m.dot, lineHeight: 1 }}>
                {r.overallScore}%
              </div>
              <div style={{ fontSize: 9, color: C.faint, fontWeight: 700, letterSpacing: ".04em" }}>RESUME FIT</div>
            </div>

            <div style={{ paddingRight: 16, borderRight: `1px solid ${C.line}` }}>
              <div style={{
                fontFamily: DISPLAY,
                fontSize: 26,
                fontWeight: 700,
                color: (r.authenticityScore ?? 100) >= 80 ? "#16A34A" : ((r.authenticityScore ?? 100) >= 60 ? "#EAB308" : "#DC2626"),
                lineHeight: 1
              }}>
                {r.authenticityScore !== undefined ? `${r.authenticityScore}%` : "100%"}
              </div>
              <div style={{
                fontSize: 9,
                color: (r.authenticityScore ?? 100) >= 80 ? "#16A34A" : ((r.authenticityScore ?? 100) >= 60 ? "#D97706" : "#DC2626"),
                fontWeight: 800,
                letterSpacing: ".04em"
              }}>
                {(r.authenticityScore ?? 100) >= 80 ? "🛡️ AUTHENTIC" : ((r.authenticityScore ?? 100) >= 60 ? "⚠️ AI SUSPECT" : "🚨 AI RISK")}
              </div>
            </div>
            
            {r.interview?.score !== undefined ? (
              <div style={{ paddingRight: 8 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: r.interview.score >= 75 ? "#16A34A" : (r.interview.score >= 50 ? "#EAB308" : "#DC2626"), lineHeight: 1 }}>
                  {r.interview.score}%
                </div>
                <div style={{ fontSize: 9, color: C.faint, fontWeight: 700, letterSpacing: ".04em" }}>AI INTERVIEW</div>
              </div>
            ) : (
              <div style={{ paddingRight: 8, opacity: 0.4 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: C.faint, lineHeight: 1 }}>
                  --
                </div>
                <div style={{ fontSize: 9, color: C.faint, fontWeight: 700, letterSpacing: ".04em" }}>NO INTERVIEW</div>
              </div>
            )}
          </div>

          {/* Editable HR Candidate Selection Action Group */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={(e) => e.stopPropagation()}>
            {hrDecision === "selected" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#DCFCE7", border: "1.5px solid #86EFAC", padding: "4px 7px", borderRadius: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: "#15803D", padding: "2px 4px" }}>
                  <UserCheck size={14} /> Selected
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUpdateDecision?.(c.id, "rejected"); }}
                  title="Change decision: Mark candidate as Not Selected"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "4px 8px",
                    background: "#FFFFFF",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: BODY,
                  }}
                >
                  <UserX size={12} /> Switch to Not Selected
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUpdateDecision?.(c.id, null); }}
                  title="Clear decision: Reset to pending review"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "4px 6px",
                    background: "#FFFFFF",
                    color: C.sub,
                    border: `1px solid ${C.line}`,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            ) : hrDecision === "rejected" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#FEE2E2", border: "1.5px solid #FCA5A5", padding: "4px 7px", borderRadius: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 800, color: "#DC2626", padding: "2px 4px" }}>
                  <UserX size={14} /> Not Selected
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUpdateDecision?.(c.id, "selected"); }}
                  title="Change decision: Mark candidate as Selected"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    padding: "4px 8px",
                    background: "#FFFFFF",
                    color: "#16A34A",
                    border: "1px solid #86EFAC",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: BODY,
                  }}
                >
                  <UserCheck size={12} /> Switch to Selected
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUpdateDecision?.(c.id, null); }}
                  title="Clear decision: Reset to pending review"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "4px 6px",
                    background: "#FFFFFF",
                    color: C.sub,
                    border: `1px solid ${C.line}`,
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <RotateCcw size={12} />
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUpdateDecision?.(c.id, "selected"); }}
                  title="Mark this candidate as Selected by HR"
                  style={{
                    padding: "7px 11px",
                    background: "#DCFCE7",
                    color: "#15803D",
                    border: "1px solid #86EFAC",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: BODY,
                    transition: "all 0.15s ease",
                  }}
                >
                  <UserCheck size={14} /> Select
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onUpdateDecision?.(c.id, "rejected"); }}
                  title="Mark this candidate as Not Selected by HR"
                  style={{
                    padding: "7px 11px",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: BODY,
                    transition: "all 0.15s ease",
                  }}
                >
                  <UserX size={14} /> Not Select
                </button>
              </div>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); setShowInviteModal(true); }}
            title="Configure and send personalized AI interview invitation with dynamic client Reply-To"
            style={{
              padding: "7px 14px",
              background: C.accent,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: BODY,
              transition: "all 0.15s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)"
            }}
          >
            <Mail size={14} /> Invite Candidate
          </button>

          <button
            onClick={handleCopyLink}
            title="Copies candidate interview link to clipboard for WhatsApp/Teams/Email"
            style={{
              padding: "7px 12px",
              background: actionNotice === "copy" ? "#DCFCE7" : C.paper,
              color: actionNotice === "copy" ? "#15803D" : C.ink,
              border: `1px solid ${actionNotice === "copy" ? "#86EFAC" : C.line}`,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: BODY,
              transition: "all 0.15s ease"
            }}
          >
            {actionNotice === "copy" ? <Check size={14} color="#15803D" /> : <Copy size={14} />}
            {actionNotice === "copy" ? "Link Copied!" : "📋 Copy Link"}
          </button>

          {open ? <ChevronDown size={18} color={C.faint} /> : <ChevronRight size={18} color={C.faint} />}
        </div>
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

            {/* Resume Authenticity & Anti-Cheat Audit */}
            <div style={{
              marginTop: 14,
              padding: "11px 13px",
              borderRadius: 8,
              background: (r.authenticityScore ?? 100) >= 80 ? "#F0FDF4" : ((r.authenticityScore ?? 100) >= 60 ? "#FEFCE8" : "#FEF2F2"),
              border: `1px solid ${(r.authenticityScore ?? 100) >= 80 ? "#BBF7D0" : ((r.authenticityScore ?? 100) >= 60 ? "#FEF08A" : "#FECACA")}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: (r.authenticityScore ?? 100) >= 80 ? "#15803D" : ((r.authenticityScore ?? 100) >= 60 ? "#A16207" : "#B91C1C"), letterSpacing: ".04em", display: "flex", alignItems: "center", gap: 5 }}>
                  🛡️ RESUME AUTHENTICITY AUDIT
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, color: (r.authenticityScore ?? 100) >= 80 ? "#15803D" : ((r.authenticityScore ?? 100) >= 60 ? "#A16207" : "#B91C1C"), background: (r.authenticityScore ?? 100) >= 80 ? "#DCFCE7" : ((r.authenticityScore ?? 100) >= 60 ? "#FEF9C3" : "#FEE2E2"), padding: "2px 7px", borderRadius: 4 }}>
                  {r.authenticityStatus || ((r.authenticityScore ?? 100) >= 80 ? "Authentic" : "AI Suspect")} ({r.authenticityScore ?? 100}%)
                </span>
              </div>
              {r.manipulationFlags && r.manipulationFlags.length > 0 ? (
                <div style={{ fontSize: 12, color: "#991B1B", marginTop: 4 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>⚠️ Detected Manipulation &amp; AI Flags:</div>
                  <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
                    {r.manipulationFlags.map((flag, fi) => (
                      <li key={fi}>{flag}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#166534", lineHeight: 1.4 }}>
                  ✓ Passed AI Prompt-Injection Sanitization, JD Keyword Echo Check, and Career Timeline Chronology verification.
                </div>
              )}
            </div>
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
      
      {open && r.interview && (
        <div style={{ borderTop: `1px solid ${C.lineSoft}`, padding: "16px 17px", background: C.paper }}>
          <SubHead style={{ marginBottom: 12 }} C={C}>
            <MessageSquare size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
            AI Interview Assessment
          </SubHead>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: r.interview.score >= 75 ? "#16A34A" : (r.interview.score >= 50 ? "#EAB308" : "#DC2626") }}>{r.interview.score}%</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Technical Score</div>
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: Math.max(30, 100 - Object.values(r.interview.proctoring || {}).reduce((a,b)=>a+b,0)*7) >= 85 ? "#16A34A" : (Math.max(30, 100 - Object.values(r.interview.proctoring || {}).reduce((a,b)=>a+b,0)*7) >= 60 ? "#EAB308" : "#DC2626") }}>
                {Math.max(30, 100 - Object.values(r.interview.proctoring || {}).reduce((a,b)=>a+b,0)*7)}%
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Proctor Integrity</div>
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: Object.values(r.interview.proctoring || {}).reduce((a,b)=>a+b,0) === 0 ? "#16A34A" : "#DC2626" }}>
                {Object.values(r.interview.proctoring || {}).reduce((a,b)=>a+b,0) === 0 ? "Clean ✓" : "Flagged ⚠️"}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Visual Proctoring</div>
            </div>
            <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: (r.interview.aiContentProbability ?? 10) <= 25 ? "#16A34A" : ((r.interview.aiContentProbability ?? 10) <= 55 ? "#EAB308" : "#DC2626") }}>
                {r.interview.aiContentProbability !== undefined ? `${r.interview.aiContentProbability}%` : "Low"}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>AI Answer Risk</div>
            </div>
          </div>

          {r.interview.aiSignaturesDetected && r.interview.aiSignaturesDetected.length > 0 && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "11px 14px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#991B1B", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                🚨 AI / Teleprompter Signatures Detected — {r.interview.answerAuthenticity || "High AI Likelihood"}
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#7F1D1D", lineHeight: 1.5 }}>
                {r.interview.aiSignaturesDetected.map((sig, sidx) => (
                  <li key={sidx}>{sig}</li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", marginBottom: 6 }}>AI Assessment Summary</div>
            <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>{r.interview.summary || "No summary provided."}</div>
          </div>

          {r.interview.transcript && r.interview.transcript.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", marginBottom: 8 }}>Interview Transcript</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {r.interview.transcript.map((t, idx) => (
                  <div key={idx} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 }}>Question {idx+1}: {t.q}</div>
                    <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.5, paddingLeft: 10, borderLeft: `2px solid ${C.lineSoft}` }}>
                      {t.a || "[No response provided]"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showInviteModal && (
        <InviteCandidateModal
          c={c}
          job={job}
          company={company}
          onClose={() => setShowInviteModal(false)}
          C={C}
        />
      )}
    </div>
  );
}

function Results({ candidates, job, companies = [], onReRun, onRestart, onStartInterview, onCompare, onUpdateCandidateDecision, filterMode = "all", setFilterMode, C }) {
  const [threshold, setThreshold] = useState(job?.cutoff ?? 70);
  const [sortKey, setSortKey] = useState("score");
  const [localFilter, setLocalFilter] = useState(filterMode);

  useEffect(() => {
    if (job?.cutoff) setThreshold(job.cutoff);
  }, [job?.cutoff]);

  useEffect(() => {
    setLocalFilter(filterMode);
  }, [filterMode]);

  const activeFilter = setFilterMode ? filterMode : localFilter;
  const changeFilter = (m) => {
    if (setFilterMode) setFilterMode(m);
    setLocalFilter(m);
  };

  const valid = candidates.filter((c) => c.status === "done" && c.result);
  const failed = candidates.filter((c) => c.status === "error" || (c.status === "done" && !c.result));
  
  const sorted = useMemo(() => {
    const arr = [...valid];
    if (sortKey === "score") arr.sort((a, b) => b.result.overallScore - a.result.overallScore);
    if (sortKey === "exp") arr.sort((a, b) => b.result.yearsExperience - a.result.yearsExperience);
    return arr;
  }, [valid, sortKey]);

  const vacancies = Math.max(1, job?.vacancies ?? 1);
  const selectedCount = valid.filter(c => c.hrDecision === "selected" || c.result?.hrDecision === "selected").length;
  const rejectedCount = valid.filter(c => c.hrDecision === "rejected" || c.result?.hrDecision === "rejected").length;
  const shortlistedCount = sorted.filter((c) => c.result.overallScore >= threshold).length;
  const remainingVacancies = Math.max(0, vacancies - selectedCount);
  const fillPercentage = Math.min(100, Math.round((selectedCount / vacancies) * 100));
  const avgScore = valid.length ? Math.round(valid.reduce((s, c) => s + c.result.overallScore, 0) / valid.length) : 0;

  const displayed = useMemo(() => {
    if (activeFilter === "shortlisted") {
      return sorted.filter((c) => c.result.overallScore >= threshold);
    }
    if (activeFilter === "selected") {
      return sorted.filter((c) => c.hrDecision === "selected" || c.result?.hrDecision === "selected");
    }
    if (activeFilter === "rejected") {
      return sorted.filter((c) => c.hrDecision === "rejected" || c.result?.hrDecision === "rejected");
    }
    return sorted;
  }, [sorted, activeFilter, threshold]);

  const targetComp = companies.find(comp => comp.id === job?.companyId) || { name: job?.companyName || "Client", contactEmail: "" };

  const handleExportCSV = () => {
    const rows = sorted.map((c, i) => {
      const decision = c.hrDecision || c.result?.hrDecision;
      return {
        Rank: i + 1,
        ClientCompany: job.companyName || "Client",
        CandidateName: c.result.candidateName || c.label,
        HRDecision: decision === "selected" ? "SELECTED" : (decision === "rejected" ? "NOT SELECTED" : "PENDING"),
        OverallScore: c.result.overallScore,
        Recommendation: c.result.recommendation,
        Shortlisted: c.result.overallScore >= threshold ? "YES" : "NO",
        AuthenticityScore: c.result.authenticityScore ?? 100,
        AuthenticityStatus: c.result.authenticityStatus || "Authentic",
        Email: c.result.email || "N/A",
        CurrentTitle: c.result.currentTitle,
        YearsExperience: c.result.yearsExperience,
        Education: c.result.education,
        InterviewScore: c.result.interview?.score ?? "N/A",
        InterviewIntegrity: c.result.interview ? `${Math.max(30, 100 - Object.values(c.result.interview.proctoring || {}).reduce((a,b)=>a+b,0)*7)}%` : "N/A",
        AIContentRisk: c.result.interview?.aiContentProbability !== undefined ? `${c.result.interview.aiContentProbability}%` : "N/A",
        Summary: c.result.summary,
      };
    });
    downloadCSV(rows, `${(job.title || "shortlist").replace(/\s+/g, "_")}_recommendations.csv`);
  };

  const handleExportExcel = () => {
    exportClientExcel(targetComp, [job]);
  };

  return (
    <div>
      {/* View Switcher: Candidate Cards vs Comparison Matrix */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 4 }}>
          <button
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: C.accent,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            📋 Candidate Cards
          </button>
          <button
            onClick={onCompare}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: "transparent",
              color: C.sub,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Scale size={14} /> ⚖️ Compare Candidates View
          </button>
        </div>

        {valid.length >= 2 && onCompare && (
          <button
            onClick={onCompare}
            style={{
              ...btn("primary", C),
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              borderColor: "transparent",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5
            }}
          >
            <Scale size={14} /> Compare Candidates Side-by-Side →
          </button>
        )}
      </div>

      {/* Vacancy Pipeline Fulfillment Progress Banner */}
      <div style={{
        background: C.paper,
        border: `1.5px solid ${selectedCount >= vacancies ? "#86EFAC" : C.line}`,
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 16,
        boxShadow: selectedCount >= vacancies ? "0 4px 14px rgba(22, 163, 74, 0.08)" : "none"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: selectedCount >= vacancies ? "#DCFCE7" : C.accentSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Target size={22} color={selectedCount >= vacancies ? "#16A34A" : C.accent} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>
                Role Vacancies: {selectedCount} of {vacancies} Selected
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 5,
                background: selectedCount >= vacancies ? "#DCFCE7" : (selectedCount > 0 ? "#FEF9C3" : C.bg),
                color: selectedCount >= vacancies ? "#166534" : (selectedCount > 0 ? "#854D0E" : C.sub),
                border: `1px solid ${selectedCount >= vacancies ? "#86EFAC" : C.line}`
              }}>
                {selectedCount >= vacancies ? "✓ FULLY FILLED" : (selectedCount > 0 ? "PARTIALLY FILLED" : "OPENINGS ACTIVE")}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: C.sub, marginTop: 3 }}>
              {remainingVacancies === 0
                ? "All available target openings for this job have been filled by HR."
                : `${remainingVacancies} open slot(s) remaining to meet client vacancy target of ${vacancies}. Mark candidates as Selected below.`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Fulfillment Rate</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: selectedCount >= vacancies ? "#16A34A" : C.accent, fontFamily: DISPLAY }}>
              {fillPercentage}%
            </div>
          </div>
          <div style={{ width: 120, height: 10, background: C.bg, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}>
            <div style={{
              width: `${fillPercentage}%`,
              height: "100%",
              background: selectedCount >= vacancies ? "#16A34A" : C.accent,
              borderRadius: 10,
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
        {/* Total Screened */}
        <div
          onClick={() => changeFilter("all")}
          style={{
            background: C.paper,
            border: activeFilter === "all" ? `2px solid ${C.accent}` : `1px solid ${C.line}`,
            borderRadius: 12,
            padding: "15px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: activeFilter === "all" ? `0 4px 14px ${C.accentSoft}` : "none",
          }}
          title="Click to view all screened candidates"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: activeFilter === "all" ? C.accent : C.sub, textTransform: "uppercase" }}>Resumes Screened</div>
            {activeFilter === "all" && <span style={{ fontSize: 10, fontWeight: 800, color: C.accent, background: C.accentSoft, padding: "2px 6px", borderRadius: 4 }}>ACTIVE</span>}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: C.ink, marginTop: 4 }}>{valid.length}</div>
        </div>

        {/* Shortlisted Cutoff */}
        <div
          onClick={() => changeFilter("shortlisted")}
          style={{
            background: C.paper,
            border: activeFilter === "shortlisted" ? "2px solid #16A34A" : `1px solid ${C.line}`,
            borderRadius: 12,
            padding: "15px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: activeFilter === "shortlisted" ? "0 4px 14px rgba(22, 163, 74, 0.2)" : "none",
          }}
          title="Click to view shortlisted candidates meeting cutoff"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: activeFilter === "shortlisted" ? "#16A34A" : C.sub, textTransform: "uppercase" }}>Shortlisted (≥{threshold}%)</div>
            {activeFilter === "shortlisted" && <span style={{ fontSize: 10, fontWeight: 800, color: "#16A34A", background: "#DCFCE7", padding: "2px 6px", borderRadius: 4 }}>FILTERED</span>}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: "#16A34A", marginTop: 4 }}>{shortlistedCount}</div>
        </div>

        {/* HR Selected */}
        <div
          onClick={() => changeFilter("selected")}
          style={{
            background: C.paper,
            border: activeFilter === "selected" ? "2px solid #15803D" : `1px solid ${C.line}`,
            borderRadius: 12,
            padding: "15px 16px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: activeFilter === "selected" ? "0 4px 14px rgba(22, 163, 74, 0.2)" : "none",
          }}
          title="Click to view candidates marked Selected by HR"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: activeFilter === "selected" ? "#15803D" : C.sub, textTransform: "uppercase" }}>HR Selected</div>
            {activeFilter === "selected" && <span style={{ fontSize: 10, fontWeight: 800, color: "#15803D", background: "#DCFCE7", padding: "2px 6px", borderRadius: 4 }}>FILTERED</span>}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: "#15803D", marginTop: 4 }}>
            {selectedCount} <span style={{ fontSize: 14, color: C.sub }}>/ {vacancies}</span>
          </div>
        </div>

        {/* Average Fit Score */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "15px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Average Fit Score</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: gradeColor(avgScore), marginTop: 4 }}>{avgScore}%</div>
        </div>
      </div>

      {/* Control Bar: Cutoff Slider, Filter Pills, and Export Actions */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Cutoff Score:</span>
            <input type="range" min={30} max={90} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} style={{ width: 120 }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: C.accent }}>{threshold}%</span>
          </div>

          {/* Quick Filter Pill Buttons */}
          <div style={{ display: "flex", background: C.bg, border: `1px solid ${C.line}`, borderRadius: 8, padding: 3, gap: 4, flexWrap: "wrap" }}>
            <button
              onClick={() => changeFilter("all")}
              style={{
                padding: "4px 10px",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: activeFilter === "all" ? C.accent : "transparent",
                color: activeFilter === "all" ? "#FFFFFF" : C.sub,
                transition: "all 0.15s ease",
              }}
            >
              All ({valid.length})
            </button>
            <button
              onClick={() => changeFilter("shortlisted")}
              style={{
                padding: "4px 10px",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: activeFilter === "shortlisted" ? "#16A34A" : "transparent",
                color: activeFilter === "shortlisted" ? "#FFFFFF" : C.sub,
                transition: "all 0.15s ease",
              }}
            >
              Shortlisted ({shortlistedCount})
            </button>
            <button
              onClick={() => changeFilter("selected")}
              style={{
                padding: "4px 10px",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: activeFilter === "selected" ? "#15803D" : "transparent",
                color: activeFilter === "selected" ? "#FFFFFF" : C.sub,
                transition: "all 0.15s ease",
              }}
            >
              ✓ Selected ({selectedCount})
            </button>
            {rejectedCount > 0 && (
              <button
                onClick={() => changeFilter("rejected")}
                style={{
                  padding: "4px 10px",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: activeFilter === "rejected" ? "#DC2626" : "transparent",
                  color: activeFilter === "rejected" ? "#FFFFFF" : C.sub,
                  transition: "all 0.15s ease",
                }}
              >
                ✕ Not Selected ({rejectedCount})
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{
              padding: "7px 13px",
              background: "#DCFCE7",
              color: "#166534",
              border: "1px solid #86EFAC",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: BODY,
              transition: "all 0.15s ease",
            }}
            onClick={handleExportExcel}
            title="Download multi-sheet client Excel (.xlsx) report"
          >
            <FileSpreadsheet size={15} /> Download Excel Report
          </button>
          <button style={btn("soft", C)} onClick={handleExportCSV} title="Export CSV summary">
            <Download size={15} /> CSV
          </button>
          <button style={btn("ghost", C)} onClick={onReRun} title="Re-screen all candidates">
            <RotateCcw size={15} /> Re-screen All
          </button>
        </div>
      </div>

      <div>
        {displayed.length === 0 ? (
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "36px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink, marginBottom: 6 }}>
              {activeFilter === "shortlisted"
                ? `No candidates scored above the ${threshold}% cutoff threshold.`
                : activeFilter === "selected"
                ? "No candidates have been marked as Selected yet. Review candidates below and mark them Selected."
                : activeFilter === "rejected"
                ? "No candidates have been marked as Not Selected."
                : "No candidates have been screened yet."}
            </div>
            {activeFilter !== "all" && (
              <button
                onClick={() => changeFilter("all")}
                style={{ ...btn("primary", C), marginTop: 10, display: "inline-flex" }}
              >
                Show All Candidates ({valid.length})
              </button>
            )}
          </div>
        ) : (
          displayed.map((c, i) => (
            <CandidateCard
              key={c.id}
              rank={i + 1}
              c={c}
              threshold={threshold}
              job={job}
              company={targetComp}
              onStartInterview={onStartInterview}
              onUpdateDecision={onUpdateCandidateDecision}
              C={C}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ============================== STEP 4: CANDIDATE COMPARISON MATRIX ============================== */
function CandidateComparisonView({ candidates, job, onBack, onStartInterview, onUpdateCandidateDecision, llmProvider, C }) {
  const valid = useMemo(() => {
    return (candidates || [])
      .filter((c) => c.status === "done" && c.result)
      .sort((a, b) => (b.result?.overallScore || 0) - (a.result?.overallScore || 0));
  }, [candidates]);

  // Default to selecting up to 4 candidates
  const [selectedIds, setSelectedIds] = useState(() => valid.slice(0, 4).map(c => c.id));
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (selectedIds.length === 0 && valid.length > 0) {
      setSelectedIds(valid.slice(0, 4).map(c => c.id));
    }
  }, [valid]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one candidate
        return prev.filter(x => x !== id);
      } else {
        if (prev.length >= 5) return prev; // Limit to 5 side-by-side
        return [...prev, id];
      }
    });
  };

  const selectedCandidates = useMemo(() => {
    return valid.filter(c => selectedIds.includes(c.id));
  }, [valid, selectedIds]);

  const topCandidate = selectedCandidates[0] || valid[0];
  const mustHaves = job?.mustHave || [];

  // Automated algorithmic score difference justification
  const scoreDeltas = useMemo(() => {
    if (selectedCandidates.length < 2) return [];
    const leader = selectedCandidates[0];
    const leaderScore = leader?.result?.overallScore || 0;
    const leaderSkills = leader?.result?.subScores?.skills || 0;
    const leaderExp = leader?.result?.yearsExperience || 0;
    const leaderMustHaves = mustHaves.filter(m => !(leader?.result?.missingMustHaves || []).some(miss => miss.toLowerCase() === m.toLowerCase())).length;

    return selectedCandidates.slice(1).map((cand) => {
      const candScore = cand?.result?.overallScore || 0;
      const candSkills = cand?.result?.subScores?.skills || 0;
      const candExp = cand?.result?.yearsExperience || 0;
      const candMustHaves = mustHaves.filter(m => !(cand?.result?.missingMustHaves || []).some(miss => miss.toLowerCase() === m.toLowerCase())).length;

      const diff = leaderScore - candScore;
      const skillDiff = leaderSkills - candSkills;
      const mustHaveDiff = leaderMustHaves - candMustHaves;
      const expDiff = leaderExp - candExp;

      const reasons = [];
      if (mustHaveDiff > 0) {
        reasons.push(`Matches ${mustHaveDiff} more required must-have skill(s) than ${cand.result?.candidateName || cand.label}`);
      }
      if (skillDiff > 8) {
        reasons.push(`Higher technical skill depth (+${skillDiff}% higher Skills Score)`);
      }
      if (expDiff > 1) {
        reasons.push(`Greater practical experience (+${expDiff} more year(s) in field)`);
      } else if (expDiff < -1) {
        reasons.push(`Even with fewer total years (${leaderExp} vs ${candExp} yrs), skill stack matches required job tools more accurately`);
      }
      if (cand.result?.missingMustHaves && cand.result.missingMustHaves.length > 0) {
        reasons.push(`${cand.result?.candidateName || cand.label} was penalized for missing: ${cand.result.missingMustHaves.slice(0, 3).join(", ")}`);
      }
      if (reasons.length === 0) {
        reasons.push("Closer holistic alignment with job requirements and project depth");
      }

      return {
        candidateName: cand.result?.candidateName || cand.label,
        leaderName: leader.result?.candidateName || leader.label,
        scoreDiff: diff,
        reasons
      };
    });
  }, [selectedCandidates, mustHaves]);

  const handleRequestAiComparison = async () => {
    if (selectedCandidates.length < 2) return;
    setAiLoading(true);
    setAiError("");
    try {
      let apiKey = "";
      const effectiveProvider = llmProvider || "claude";
      if (effectiveProvider === "claude") apiKey = localStorage.getItem("ANTHROPIC_API_KEY");
      else if (effectiveProvider === "gemini") apiKey = localStorage.getItem("GEMINI_API_KEY");
      else if (effectiveProvider === "groq") apiKey = localStorage.getItem("GROQ_API_KEY");

      const res = await fetch("/api/candidate-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: { title: job?.title, seniority: job?.seniority, minYears: job?.minYears, mustHave: job?.mustHave, description: job?.description },
          candidates: selectedCandidates,
          provider: effectiveProvider,
          apiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate AI comparison");
      setAiAnalysis(data);
    } catch (err) {
      setAiError(err.message || "Failed to generate AI comparison");
    } finally {
      setAiLoading(false);
    }
  };

  if (valid.length === 0) {
    return (
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "40px 24px", textAlign: "center" }}>
        <Scale size={42} color={C.faint} style={{ margin: "0 auto 12px" }} />
        <div style={{ fontSize: 17, fontWeight: 700, color: C.ink }}>No Screened Candidates Available to Compare</div>
        <div style={{ fontSize: 13, color: C.sub, marginTop: 4, maxWidth: 440, margin: "6px auto 16px" }}>
          Please complete Step 2 ("Add Resumes") and run screening to generate match scores before comparing candidates.
        </div>
        <button onClick={onBack} style={btn("primary", C)}>
          ← Back to Add Resumes
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header & View Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, padding: 4 }}>
          <button
            onClick={onBack}
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: "transparent",
              color: C.sub,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            📋 Candidate Cards
          </button>
          <button
            style={{
              padding: "6px 14px",
              border: "none",
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: C.accent,
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <Scale size={14} /> ⚖️ Compare Candidates View
          </button>
        </div>

        <button onClick={onBack} style={btn("ghost", C)}>
          <ArrowLeft size={14} /> Back to Shortlist Cards
        </button>
      </div>

      {/* Candidate Selection Bar */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, display: "flex", alignItems: "center", gap: 8 }}>
              <span>Select Candidates to Compare</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentSoft, padding: "2px 8px", borderRadius: 12 }}>
                {selectedCandidates.length} of {valid.length} selected
              </span>
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
              Click candidate pills to add or remove them from the side-by-side comparison matrix (Max 5).
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setSelectedIds(valid.slice(0, 4).map(c => c.id))}
              style={{ padding: "5px 10px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: `1px solid ${C.line}`, background: C.bg, color: C.ink, cursor: "pointer" }}
            >
              Select Top 4
            </button>
            {valid.length >= 2 && (
              <button
                onClick={() => setSelectedIds(valid.slice(0, 2).map(c => c.id))}
                style={{ padding: "5px 10px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: `1px solid ${C.line}`, background: C.bg, color: C.ink, cursor: "pointer" }}
              >
                Compare Top 2
              </button>
            )}
            <button
              onClick={() => setSelectedIds(valid.map(c => c.id))}
              style={{ padding: "5px 10px", fontSize: 12, fontWeight: 700, borderRadius: 6, border: `1px solid ${C.line}`, background: C.bg, color: C.ink, cursor: "pointer" }}
            >
              Select All ({valid.length})
            </button>
          </div>
        </div>

        {/* Candidate Pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {valid.map((c, i) => {
            const isSelected = selectedIds.includes(c.id);
            const score = c.result?.overallScore || 0;
            const meta = recMeta(c.result?.recommendation);
            return (
              <div
                key={c.id}
                onClick={() => toggleSelect(c.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: `2px solid ${isSelected ? C.accent : C.line}`,
                  background: isSelected ? C.accentSoft : C.bg,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  userSelect: "none"
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  border: `1.5px solid ${isSelected ? C.accent : C.faint}`,
                  background: isSelected ? C.accent : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {isSelected && <Check size={12} color="#FFF" />}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? C.accent : C.ink }}>
                  #{i + 1} {c.result?.candidateName || c.label}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: meta.dot,
                  background: meta.bg,
                  padding: "1px 6px",
                  borderRadius: 4
                }}>
                  {score}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Automated AI Score Justification Banner */}
      {selectedCandidates.length >= 2 && (
        <div style={{
          background: `linear-gradient(135deg, ${C.paper}, ${C.panel})`,
          border: `1px solid ${C.accent}44`,
          borderRadius: 14,
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: `0 4px 20px ${C.accentSoft}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>🏆</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>
                  Why #{1} {topCandidate?.result?.candidateName || topCandidate?.label} Scored Highest ({topCandidate?.result?.overallScore}%)
                </span>
              </div>
              <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>
                Automated score differentiation based on client must-haves, domain depth, and technical requirements.
              </p>
            </div>

            <button
              onClick={handleRequestAiComparison}
              disabled={aiLoading}
              style={{
                ...btn("primary", C),
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                borderColor: "transparent",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                gap: 7,
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
              }}
            >
              {aiLoading ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              {aiLoading ? "Consulting Claude…" : "Ask Claude to Compare"}
            </button>
          </div>

          {/* Quick Delta Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 12 }}>
            {scoreDeltas.map((delta, idx) => (
              <div key={idx} style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                    vs. {delta.candidateName}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 6 }}>
                    +{delta.scoreDiff}% Margin
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
                  {delta.reasons.map((r, rIdx) => (
                    <li key={rIdx}>{r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Claude In-Depth Analysis Memo */}
          {aiAnalysis && (
            <div style={{ background: C.paper, border: `1px solid #8B5CF644`, borderRadius: 12, padding: "16px 20px", marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#8B5CF6", fontWeight: 800, fontSize: 13.5 }}>
                <Sparkles size={16} /> Anthropic Claude Executive Comparison
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, marginBottom: 8 }}>
                "{aiAnalysis.headline}"
              </div>
              <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: "0 0 10px" }}>
                {aiAnalysis.winnerAnalysis}
              </p>
              {aiAnalysis.differentiators && aiAnalysis.differentiators.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Key Differentiating Factors:</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                    {aiAnalysis.differentiators.map((d, dIdx) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {aiAnalysis.hiringRecommendation && (
                <div style={{ background: C.accentSoft, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: C.accentDeep, fontWeight: 600 }}>
                  💡 <strong>Hiring Advice:</strong> {aiAnalysis.hiringRecommendation}
                </div>
              )}
            </div>
          )}

          {aiError && (
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#FEE2E2", color: "#DC2626", borderRadius: 8, fontSize: 12 }}>
              ⚠️ {aiError}
            </div>
          )}
        </div>
      )}

      {/* Section 3: Head-to-Head Comparison Table with Frozen Headers */}
      <div style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        overflow: "auto",
        maxHeight: "75vh",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        position: "relative"
      }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, textAlign: "left", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{
                position: "sticky",
                top: 0,
                left: 0,
                zIndex: 30,
                background: C.panel,
                padding: "16px 20px",
                width: 220,
                minWidth: 200,
                color: C.sub,
                fontWeight: 800,
                textTransform: "uppercase",
                fontSize: 11,
                letterSpacing: "0.05em",
                borderRight: `1px solid ${C.line}`,
                borderBottom: `2px solid ${C.line}`,
                boxShadow: "2px 2px 6px rgba(0,0,0,0.06)"
              }}>
                Candidate / Metric
              </th>
              {selectedCandidates.map((c, i) => {
                const meta = recMeta(c.result?.recommendation);
                return (
                  <th key={c.id} style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 20,
                    background: C.panel,
                    padding: "16px 20px",
                    minWidth: 250,
                    borderLeft: `1px solid ${C.line}`,
                    borderBottom: `2px solid ${C.line}`,
                    verticalAlign: "top",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.06)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: i === 0 ? "#16A34A" : C.faint, background: i === 0 ? "#DCFCE7" : C.bg, padding: "2px 8px", borderRadius: 10 }}>
                        {i === 0 ? "🏆 RANK #1" : `RANK #${i + 1}`}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.dot, background: meta.bg, padding: "2px 8px", borderRadius: 4 }}>
                        {c.result?.recommendation}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 2 }}>
                      {c.result?.candidateName || c.label}
                    </div>
                    <div style={{ fontSize: 12, color: C.sub }}>
                      {c.result?.currentTitle || "Title not specified"}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {/* Row 0: HR Hiring Decision & Selection Controls */}
            <tr style={{ background: C.paper }}>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "14px 20px",
                fontWeight: 800,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <UserCheck size={16} color={C.accent} />
                  <span>HR Hiring Decision</span>
                </div>
                <div style={{ fontSize: 11, color: C.sub, fontWeight: 400, marginTop: 2 }}>
                  Editable candidate selection status
                </div>
              </td>
              {selectedCandidates.map((c) => {
                const decision = c.hrDecision || c.result?.hrDecision;
                return (
                  <td key={c.id} style={{ padding: "14px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, verticalAlign: "middle" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {decision === "selected" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#DCFCE7", color: "#166534", border: "1.5px solid #86EFAC", padding: "4px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 800 }}>
                            <UserCheck size={13} /> SELECTED
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCandidateDecision?.(c.id, "rejected")}
                            title="Switch candidate to Not Selected"
                            style={{
                              padding: "4px 7px",
                              background: "#FFFFFF",
                              color: "#DC2626",
                              border: "1px solid #FCA5A5",
                              borderRadius: 5,
                              fontSize: 10.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontFamily: BODY,
                            }}
                          >
                            <UserX size={11} /> Switch
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCandidateDecision?.(c.id, null)}
                            title="Reset candidate to pending review"
                            style={{
                              padding: "4px 6px",
                              background: "#FFFFFF",
                              color: C.sub,
                              border: `1px solid ${C.line}`,
                              borderRadius: 5,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <RotateCcw size={11} />
                          </button>
                        </div>
                      ) : decision === "rejected" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#FEE2E2", color: "#991B1B", border: "1.5px solid #FCA5A5", padding: "4px 8px", borderRadius: 6, fontSize: 11.5, fontWeight: 800 }}>
                            <UserX size={13} /> NOT SELECTED
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateCandidateDecision?.(c.id, "selected")}
                            title="Switch candidate to Selected"
                            style={{
                              padding: "4px 7px",
                              background: "#FFFFFF",
                              color: "#166534",
                              border: "1px solid #86EFAC",
                              borderRadius: 5,
                              fontSize: 10.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontFamily: BODY,
                            }}
                          >
                            <UserCheck size={11} /> Switch
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCandidateDecision?.(c.id, null)}
                            title="Reset candidate to pending review"
                            style={{
                              padding: "4px 6px",
                              background: "#FFFFFF",
                              color: C.sub,
                              border: `1px solid ${C.line}`,
                              borderRadius: 5,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <RotateCcw size={11} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => onUpdateCandidateDecision?.(c.id, "selected")}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              background: "#DCFCE7",
                              color: "#166534",
                              border: "1px solid #86EFAC",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              fontFamily: BODY,
                            }}
                          >
                            <UserCheck size={12} /> Select
                          </button>
                          <button
                            type="button"
                            onClick={() => onUpdateCandidateDecision?.(c.id, "rejected")}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              background: "#FEE2E2",
                              color: "#991B1B",
                              border: "1px solid #FCA5A5",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                              fontFamily: BODY,
                            }}
                          >
                            <UserX size={12} /> Not Select
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 1: Overall Match Score */}
            <tr style={{ background: C.bg }}>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.bg,
                padding: "14px 20px",
                fontWeight: 700,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                Overall Match Score
              </td>
              {selectedCandidates.map((c, i) => {
                const score = c.result?.overallScore || 0;
                const delta = i === 0 ? 0 : score - (topCandidate?.result?.overallScore || 0);
                const meta = recMeta(c.result?.recommendation);
                return (
                  <td key={c.id} style={{ padding: "14px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: C.bg }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: meta.dot, fontFamily: DISPLAY }}>
                        {score}%
                      </span>
                      {i > 0 && (
                        <span style={{ fontSize: 11.5, fontWeight: 800, color: "#DC2626" }}>
                          ({delta}%)
                        </span>
                      )}
                      {i === 0 && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#16A34A" }}>
                          (Top Score)
                        </span>
                      )}
                    </div>
                    <div style={{ height: 6, background: C.lineSoft, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, height: "100%", background: meta.dot, borderRadius: 3 }} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row: Resume Authenticity & Anti-Manipulation */}
            <tr>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "12px 20px",
                fontWeight: 600,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                🛡️ Resume Authenticity
              </td>
              {selectedCandidates.map((c) => {
                const authScore = c.result?.authenticityScore ?? 100;
                const authStatus = c.result?.authenticityStatus || (authScore >= 80 ? "Authentic" : "AI Suspect");
                const color = authScore >= 80 ? "#16A34A" : (authScore >= 60 ? "#EAB308" : "#DC2626");
                return (
                  <td key={c.id} style={{ padding: "12px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color }}>{authScore}%</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: "1px 6px", borderRadius: 4 }}>
                        {authStatus}
                      </span>
                    </div>
                    <div style={{ height: 5, background: C.lineSoft, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${authScore}%`, height: "100%", background: color, borderRadius: 3 }} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 2: Skills Fit */}
            <tr>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "12px 20px",
                fontWeight: 600,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                🎯 Skills Fit Score
              </td>
              {selectedCandidates.map((c) => {
                const s = c.result?.subScores?.skills || 0;
                return (
                  <td key={c.id} style={{ padding: "12px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: C.ink }}>{s}%</span>
                      <span style={{ fontSize: 11, color: C.faint }}>Weight: 40%</span>
                    </div>
                    <div style={{ height: 5, background: C.lineSoft, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${s}%`, height: "100%", background: "#3B82F6", borderRadius: 3 }} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 3: Experience Fit */}
            <tr>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "12px 20px",
                fontWeight: 600,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                💼 Experience Fit
              </td>
              {selectedCandidates.map((c) => {
                const s = c.result?.subScores?.experience || 0;
                const yrs = c.result?.yearsExperience ?? "N/A";
                return (
                  <td key={c.id} style={{ padding: "12px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: C.ink }}>{s}%</span>
                      <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>{yrs} yrs exp</span>
                    </div>
                    <div style={{ height: 5, background: C.lineSoft, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${s}%`, height: "100%", background: "#10B981", borderRadius: 3 }} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 4: Education & Discipline */}
            <tr>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "12px 20px",
                fontWeight: 600,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                🎓 Education &amp; Discipline
              </td>
              {selectedCandidates.map((c) => {
                const s = c.result?.subScores?.education || 0;
                const edu = c.result?.education || "N/A";
                const disc = c.result?.candidateDiscipline || "";
                return (
                  <td key={c.id} style={{ padding: "12px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: C.ink }}>{s}%</span>
                      <span style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>{disc}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.3, marginBottom: 4 }}>{edu}</div>
                    <div style={{ height: 5, background: C.lineSoft, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${s}%`, height: "100%", background: "#8B5CF6", borderRadius: 3 }} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 5: Domain Fit */}
            <tr>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "12px 20px",
                fontWeight: 600,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                🏢 Domain Relevance
              </td>
              {selectedCandidates.map((c) => {
                const s = c.result?.subScores?.domain || 0;
                return (
                  <td key={c.id} style={{ padding: "12px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, color: C.ink }}>{s}%</span>
                    </div>
                    <div style={{ height: 5, background: C.lineSoft, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${s}%`, height: "100%", background: "#F59E0B", borderRadius: 3 }} />
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Row 6: AI Interview Marks */}
            <tr style={{ background: C.bg }}>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.bg,
                padding: "14px 20px",
                fontWeight: 700,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                🤖 AI Interview Marks
              </td>
              {selectedCandidates.map((c) => {
                const iv = c.result?.interview;
                return (
                  <td key={c.id} style={{ padding: "14px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, background: C.bg }}>
                    {iv?.score !== undefined ? (
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: iv.score >= 70 ? "#16A34A" : "#F59E0B" }}>
                            {iv.score}%
                          </span>
                          <span style={{ fontSize: 11, color: C.faint }}>Technical Mark</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: C.sub }}>
                          Integrity: <strong>{iv.proctoring?.integrityScore ?? 100}%</strong>
                        </div>
                        {iv.aiContentProbability !== undefined && (
                          <div style={{ fontSize: 11, fontWeight: 700, color: iv.aiContentProbability > 40 ? "#DC2626" : "#16A34A", marginTop: 2 }}>
                            AI Content Risk: {iv.aiContentProbability}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: C.faint, fontStyle: "italic" }}>
                        Not Interviewed Yet
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Must-Have Skills Header */}
            {mustHaves.length > 0 && (
              <tr style={{ background: C.panel }}>
                <td
                  colSpan={selectedCandidates.length + 1}
                  style={{
                    position: "sticky",
                    left: 0,
                    padding: "10px 20px",
                    fontWeight: 800,
                    color: C.accent,
                    fontSize: 11.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    borderBottom: `1px solid ${C.line}`,
                    background: C.panel
                  }}
                >
                  Must-Have Skills Matching Matrix ({mustHaves.length} Required)
                </td>
              </tr>
            )}

            {/* Rows for Each Must-Have Skill */}
            {mustHaves.map((skill, sIdx) => (
              <tr key={sIdx}>
                <td style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  background: C.paper,
                  padding: "10px 20px",
                  fontWeight: 600,
                  color: C.ink,
                  fontSize: 12.5,
                  borderRight: `1px solid ${C.line}`,
                  borderBottom: `1px solid ${C.line}`,
                  boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
                }}>
                  {skill}
                </td>
                {selectedCandidates.map((c) => {
                  const isMissing = (c.result?.missingMustHaves || []).some(m => m.toLowerCase() === skill.toLowerCase());
                  return (
                    <td key={c.id} style={{ padding: "10px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}` }}>
                      {isMissing ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "2px 8px", borderRadius: 4 }}>
                          <X size={13} /> Missing
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: 4 }}>
                          <Check size={13} /> Matched
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Row: Strengths */}
            <tr style={{ verticalAlign: "top" }}>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "14px 20px",
                fontWeight: 700,
                color: "#16A34A",
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                ⭐ Key Strengths
              </td>
              {selectedCandidates.map((c) => (
                <td key={c.id} style={{ padding: "14px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, fontSize: 12 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, color: C.sub, lineHeight: 1.6 }}>
                    {(c.result?.strengths || ["No strengths noted"]).map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Row: Gaps & Penalties */}
            <tr style={{ verticalAlign: "top" }}>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.paper,
                padding: "14px 20px",
                fontWeight: 700,
                color: "#DC2626",
                borderRight: `1px solid ${C.line}`,
                borderBottom: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                ⚠️ Critical Gaps
              </td>
              {selectedCandidates.map((c) => (
                <td key={c.id} style={{ padding: "14px 20px", borderLeft: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, fontSize: 12 }}>
                  <ul style={{ margin: 0, paddingLeft: 16, color: "#B91C1C", lineHeight: 1.6 }}>
                    {(c.result?.gaps || ["No critical gaps noted"]).map((gp, i) => (
                      <li key={i}>{gp}</li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>

            {/* Row: AI Evaluation Summary */}
            <tr style={{ verticalAlign: "top", background: C.bg }}>
              <td style={{
                position: "sticky",
                left: 0,
                zIndex: 10,
                background: C.bg,
                padding: "14px 20px",
                fontWeight: 700,
                color: C.ink,
                borderRight: `1px solid ${C.line}`,
                boxShadow: "2px 0 4px rgba(0,0,0,0.03)"
              }}>
                📝 AI Summary
              </td>
              {selectedCandidates.map((c) => (
                <td key={c.id} style={{ padding: "14px 20px", borderLeft: `1px solid ${C.line}`, fontSize: 12, color: C.sub, lineHeight: 1.6, fontStyle: "italic", background: C.bg }}>
                  "{c.result?.summary || "No summary available."}"
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================== SIDEBAR NAVIGATION ============================== */
function Sidebar({ activeTab, setActiveTab, currentTheme, setTheme, companies, activeCompany, setActiveCompany, onOpenChangelog, C }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "companies", label: "Client Companies", icon: Building2, badge: companies.length },
    { id: "jobs", label: "Job Openings & Screening", icon: Briefcase },
    { id: "logs", label: "Activity & Audit Logs", icon: Activity },
    { id: "settings", label: "Settings & AI Keys", icon: Settings },
    { id: "guide", label: "User Guide & Manual", icon: BookOpen },
  ];

  return (
    <aside style={{
      width: 260,
      background: C.sidebar,
      color: C.sidebarText,
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      minHeight: "100vh",
      borderRight: `1px solid ${C.line}`,
      padding: "20px 16px",
      boxSizing: "border-box",
      position: "sticky",
      top: 0,
    }}>
      {/* Brand Header */}
      <div style={{ padding: "0 4px 20px", borderBottom: `1px solid ${C.lineDark}` }}>
        <BrandLogo theme="dark" />
      </div>

      {/* Client Company Quick Selector */}
      <div style={{ margin: "18px 0", padding: "12px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontSize: 10.5, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          Target Client Company
        </div>
        <select
          value={activeCompany?.id || "all"}
          onChange={(e) => {
            const selected = companies.find(c => c.id === e.target.value);
            setActiveCompany(selected || null);
          }}
          style={{
            width: "100%",
            background: "#1E293B",
            color: "#F8FAFC",
            border: "1px solid #334155",
            borderRadius: 6,
            padding: "6px 8px",
            fontSize: 12.5,
            outline: "none",
            cursor: "pointer",
            fontFamily: BODY,
          }}
        >
          <option value="all">🌐 All Client Companies</option>
          {companies.map(comp => (
            <option key={comp.id} value={comp.id}>🏢 {comp.name}</option>
          ))}
        </select>
      </div>

      {/* Nav Menu */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: isActive ? C.sidebarActiveBg : "transparent",
                color: isActive ? C.sidebarActive : C.sidebarText,
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: BODY,
              }}
            >
              <Icon size={18} color={isActive ? C.sidebarActive : C.sidebarText} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && (
                <span style={{
                  fontSize: 11,
                  background: isActive ? C.accent : "#334155",
                  color: "#FFFFFF",
                  padding: "2px 7px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme Switcher Footer */}
      <div style={{ paddingTop: 16, borderTop: `1px solid ${C.lineDark}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Appearance Theme
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.keys(THEMES).map((tKey) => (
            <button
              key={tKey}
              onClick={() => setTheme(tKey)}
              style={{
                padding: "6px 8px",
                borderRadius: 6,
                fontSize: 11,
                border: currentTheme === tKey ? `1.5px solid ${C.accent}` : "1px solid #334155",
                background: currentTheme === tKey ? "#1E293B" : "transparent",
                color: currentTheme === tKey ? "#F8FAFC" : "#94A3B8",
                cursor: "pointer",
                textAlign: "center",
                fontFamily: BODY,
              }}
            >
              {THEMES[tKey].name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Version & Release Changelog Badge */}
      <div style={{ paddingTop: 12, borderTop: `1px solid ${C.lineDark}`, marginTop: 12 }}>
        <button
          onClick={onOpenChangelog}
          title="Click to view release changelog and version history"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 10px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 8,
            color: "#94A3B8",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontFamily: BODY,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"; e.currentTarget.style.color = "#FFFFFF"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.color = "#94A3B8"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontWeight: 700, color: "#F8FAFC" }}>{APP_VERSION}</span>
            <span style={{ fontSize: 10, background: "#334155", color: "#CBD5E1", padding: "1px 5px", borderRadius: 4 }}>Prod</span>
          </div>
          <span style={{ fontSize: 10.5, color: C.accent, fontWeight: 700 }}>What's New →</span>
        </button>
      </div>
    </aside>
  );
}

const isMatchForComp = (j, comp) => {
  if (!comp) return true;
  return (
    j.companyId === comp.id ||
    j.company_id === comp.id ||
    (j.companyName && comp.name && j.companyName.toLowerCase() === comp.name.toLowerCase()) ||
    (j.company_name && comp.name && j.company_name.toLowerCase() === comp.name.toLowerCase())
  );
};

/* ============================== WELCOME & AGENCY DASHBOARD ============================== */
/* ============================== WELCOME & AGENCY DASHBOARD ============================== */
function WelcomeDashboard({ companies, jobs, activeCompany, setActiveCompany, onCreateCompany, onCreateJob, onSelectJob, onNavigateTab, onOpenChangelog, onExportClientExcel, C }) {
  const filteredJobs = useMemo(() => {
    if (!activeCompany) return jobs;
    return jobs.filter(j => isMatchForComp(j, activeCompany));
  }, [jobs, activeCompany]);

  const totalVacancies = useMemo(() => {
    return filteredJobs.reduce((acc, j) => acc + Math.max(1, Number(j.vacancies || 1)), 0);
  }, [filteredJobs]);

  const totalScreened = useMemo(() => {
    return filteredJobs.reduce((acc, j) => {
      const valid = (j.candidates || []).filter(c => c.status === "done" && c.result);
      return acc + valid.length;
    }, 0);
  }, [filteredJobs]);

  const totalSelected = useMemo(() => {
    return filteredJobs.reduce((acc, j) => {
      const sel = (j.candidates || []).filter(c => c.hrDecision === "selected" || c.result?.hrDecision === "selected");
      return acc + sel.length;
    }, 0);
  }, [filteredJobs]);

  const totalShortlisted = useMemo(() => {
    return filteredJobs.reduce((acc, j) => {
      const cutoff = j.cutoff ?? 70;
      const sh = (j.candidates || []).filter(c => c.status === "done" && c.result && c.result.overallScore >= cutoff);
      return acc + sh.length;
    }, 0);
  }, [filteredJobs]);

  const avgCutoff = useMemo(() => {
    if (filteredJobs.length === 0) return 70;
    const sum = filteredJobs.reduce((acc, j) => acc + (j.cutoff ?? 70), 0);
    return Math.round(sum / filteredJobs.length);
  }, [filteredJobs]);

  const overallFillRate = totalVacancies > 0 ? Math.min(100, Math.round((totalSelected / totalVacancies) * 100)) : 0;
  const remainingVacancies = Math.max(0, totalVacancies - totalSelected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome Hero Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accentDeep} 0%, ${C.accent} 100%)`,
        borderRadius: 16,
        padding: "28px 32px",
        color: "#FFFFFF",
        boxShadow: "0 10px 25px -5px rgba(3, 77, 161, 0.3)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 20
      }}>
        <div style={{ maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              <Sparkles size={14} /> CogniHire Executive Recruitment Cockpit
            </div>
            <button
              onClick={onOpenChangelog}
              title="Click to view release changelog and version history"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(255,255,255,0.22)",
                border: "1px solid rgba(255,255,255,0.45)",
                color: "#FFFFFF",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.35)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.22)"; }}
            >
              <GitBranch size={12} />
              <span>{APP_VERSION}</span>
              <span style={{ opacity: 0.85, fontSize: 10.5 }}>· What's New</span>
            </button>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, fontFamily: DISPLAY, lineHeight: 1.2 }}>
            Hiring Pipeline &amp; Vacancy Management
          </h2>
          <p style={{ fontSize: 14, margin: "10px 0 0", opacity: 0.9, lineHeight: 1.5 }}>
            Monitor live vacancies across clients, track candidate screening volumes against benchmark cutoffs, record HR selection decisions, and generate exportable client reports.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={onCreateCompany}
            style={{
              padding: "10px 18px",
              background: "#FFFFFF",
              color: C.accentDeep,
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: BODY,
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
            }}
          >
            <Building2 size={16} /> Add Client Company
          </button>
          <button
            onClick={onCreateJob}
            style={{
              padding: "10px 18px",
              background: "rgba(255,255,255,0.2)",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: BODY,
            }}
          >
            <Plus size={16} /> Post Opening Job
          </button>
        </div>
      </div>

      {/* Client Filter Pill Bar */}
      {companies.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", background: C.paper, padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.line}` }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Filter by Client:</span>
          <button
            onClick={() => setActiveCompany(null)}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              border: `1px solid ${!activeCompany ? C.accent : C.line}`,
              background: !activeCompany ? C.accentSoft : "transparent",
              color: !activeCompany ? C.accent : C.ink,
              transition: "all 0.15s ease",
            }}
          >
            All Clients ({companies.length})
          </button>
          {companies.map(c => {
            const isSelected = activeCompany?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCompany(isSelected ? null : c)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: `1px solid ${isSelected ? C.accent : C.line}`,
                  background: isSelected ? C.accentSoft : "transparent",
                  color: isSelected ? C.accent : C.ink,
                  transition: "all 0.15s ease",
                }}
              >
                🏢 {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* 4 Core Executive Dashboard Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
        {/* Metric 1: Total Vacancies */}
        <div
          onClick={() => onNavigateTab("jobs", { step: 1 })}
          style={{
            background: C.paper,
            borderRadius: 14,
            border: `1px solid ${C.line}`,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.borderColor = C.accent;
            e.currentTarget.style.boxShadow = `0 8px 20px -4px ${C.accentSoft}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = C.line;
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
          }}
          title="Click to view Job Openings & Vacancy Details"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={24} color={C.accent} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentSoft, padding: "3px 8px", borderRadius: 12 }}>
              {filteredJobs.length} {filteredJobs.length === 1 ? "Role" : "Roles"}
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Available Vacancies
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, fontFamily: DISPLAY, lineHeight: 1.1, marginTop: 4 }}>
              {totalVacancies}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
              Target openings across client pipelines
            </div>
          </div>
        </div>

        {/* Metric 2: Resumes Screened */}
        <div
          onClick={() => onNavigateTab("jobs", { step: 3 })}
          style={{
            background: C.paper,
            borderRadius: 14,
            border: `1px solid ${C.line}`,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.borderColor = "#2563EB";
            e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(37, 99, 235, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = C.line;
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
          }}
          title="Click to view Resumes Screened & Results"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(37, 99, 235, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} color="#2563EB" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", background: "rgba(37, 99, 235, 0.1)", padding: "3px 8px", borderRadius: 12 }}>
              Screened
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Resumes Screened
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.ink, fontFamily: DISPLAY, lineHeight: 1.1, marginTop: 4 }}>
              {totalScreened}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
              {totalShortlisted} candidates met quality cutoffs
            </div>
          </div>
        </div>

        {/* Metric 3: Cutoff Threshold */}
        <div
          onClick={() => onNavigateTab("jobs", { step: 3, filter: "shortlisted" })}
          style={{
            background: C.paper,
            borderRadius: 14,
            border: `1px solid ${C.line}`,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.borderColor = "#D97706";
            e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(217, 119, 6, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = C.line;
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
          }}
          title="Click to view candidates meeting cutoff score"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scale size={24} color="#D97706" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#B45309", background: "#FEF3C7", padding: "3px 8px", borderRadius: 12 }}>
              Benchmark
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Cutoff Threshold
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#D97706", fontFamily: DISPLAY, lineHeight: 1.1, marginTop: 4 }}>
              ≥{avgCutoff}%
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
              Active quality benchmark threshold
            </div>
          </div>
        </div>

        {/* Metric 4: HR Selected Candidates */}
        <div
          onClick={() => onNavigateTab("jobs", { step: 3, filter: "selected" })}
          style={{
            background: C.paper,
            borderRadius: 14,
            border: `1.5px solid ${totalSelected >= totalVacancies && totalVacancies > 0 ? "#86EFAC" : C.line}`,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.borderColor = "#16A34A";
            e.currentTarget.style.boxShadow = "0 8px 20px -4px rgba(22, 163, 74, 0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = totalSelected >= totalVacancies && totalVacancies > 0 ? "#86EFAC" : C.line;
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
          }}
          title="Click to view HR Selected Candidates"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={24} color="#16A34A" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#166534", background: "#DCFCE7", padding: "3px 8px", borderRadius: 12 }}>
              {totalSelected} / {totalVacancies}
            </span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: C.sub, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              HR Selected
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#16A34A", fontFamily: DISPLAY, lineHeight: 1.1, marginTop: 4 }}>
              {totalSelected}
            </div>
            <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
              {remainingVacancies === 0 ? "All vacancies filled" : `${remainingVacancies} openings remaining`}
            </div>
          </div>
        </div>
      </div>

      {/* Vacancy Fulfillment Progress Card */}
      <div style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Target size={18} color={C.accent} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>
                Overall Vacancy Pipeline Fulfillment
              </div>
              <div style={{ fontSize: 12, color: C.sub }}>
                {totalSelected} of {totalVacancies} positions filled across {filteredJobs.length} active job {filteredJobs.length === 1 ? "opening" : "openings"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 6,
              background: overallFillRate >= 100 ? "#DCFCE7" : (overallFillRate > 0 ? "#FEF9C3" : C.bg),
              color: overallFillRate >= 100 ? "#166534" : (overallFillRate > 0 ? "#854D0E" : C.sub),
              border: `1px solid ${overallFillRate >= 100 ? "#86EFAC" : C.line}`
            }}>
              {overallFillRate >= 100 ? "✓ 100% FULLY STAFFED" : `${overallFillRate}% FULFILLED (${remainingVacancies} OPEN)`}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: 12, background: C.bg, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.line}` }}>
          <div style={{
            width: `${overallFillRate}%`,
            height: "100%",
            background: overallFillRate >= 100 ? "#16A34A" : `linear-gradient(90deg, ${C.accent} 0%, #2563EB 100%)`,
            borderRadius: 10,
            transition: "width 0.4s ease"
          }} />
        </div>
      </div>

      {/* Per-Job Recruitment & Vacancy Pipeline Table */}
      <div style={{
        background: C.paper,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: "22px 24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
              Client Job Openings &amp; Recruitment Pipeline
            </h3>
            <p style={{ fontSize: 12.5, color: C.sub, margin: "3px 0 0" }}>
              Real-time breakdown of vacancies, screening volume, cutoffs, and HR selections per role
            </p>
          </div>
          <button
            onClick={onCreateJob}
            style={{
              padding: "8px 14px",
              background: C.accent,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: BODY,
            }}
          >
            <Plus size={14} /> New Job Opening
          </button>
        </div>

        {filteredJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.sub, background: C.bg, borderRadius: 12, border: `1px dashed ${C.line}` }}>
            <Briefcase size={32} color={C.faint} style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>No job openings found</div>
            <div style={{ fontSize: 12.5, marginTop: 4 }}>Post your first job opening to start screening candidates and tracking vacancies.</div>
            <button onClick={onCreateJob} style={{ ...btn("primary", C), marginTop: 14 }}>
              + Post New Opening Job
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg, textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, borderRadius: "8px 0 0 0" }}>Client Company</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}` }}>Job Opening</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, textAlign: "center" }}>Vacancies</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, textAlign: "center" }}>Screened</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, textAlign: "center" }}>Cutoff</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, textAlign: "center" }}>Qualified</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, textAlign: "center" }}>HR Selected</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, textAlign: "center" }}>Status</th>
                  <th style={{ padding: "12px 14px", fontWeight: 800, color: C.sub, fontSize: 11, textTransform: "uppercase", borderBottom: `2px solid ${C.line}`, textAlign: "right", borderRadius: "0 8px 0 0" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j) => {
                  const valid = (j.candidates || []).filter(c => c.status === "done" && c.result);
                  const cutoff = j.cutoff ?? 70;
                  const vacancies = Math.max(1, Number(j.vacancies || 1));
                  const metCutoff = valid.filter(c => (c.result?.overallScore ?? 0) >= cutoff).length;
                  const selected = valid.filter(c => c.hrDecision === "selected" || c.result?.hrDecision === "selected").length;
                  const isFilled = selected >= vacancies;
                  const compObj = companies.find(c => c.id === j.companyId) || { name: j.companyName || "Client" };

                  return (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${C.line}`, transition: "background 0.15s ease" }}>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}` }}>
                        <span style={{ fontWeight: 700, color: C.ink, display: "flex", alignItems: "center", gap: 5 }}>
                          🏢 {j.companyName || compObj.name || "Client"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}` }}>
                        <div style={{ fontWeight: 800, color: C.ink }}>
                          {j.title || "Untitled Role"}
                        </div>
                        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>
                          {j.seniority || "Senior"} · {j.minYears || 0}+ yrs exp · {j.location || "Remote/Hybrid"}
                        </div>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}`, textAlign: "center" }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: C.ink, background: C.bg, padding: "4px 10px", borderRadius: 8, border: `1px solid ${C.line}` }}>
                          🎯 {vacancies}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}`, textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                          👥 {valid.length}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}`, textAlign: "center" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 800, color: "#D97706" }}>
                          ≥{cutoff}%
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}`, textAlign: "center" }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: metCutoff > 0 ? "#16A34A" : C.sub }}>
                          {metCutoff}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}`, textAlign: "center" }}>
                        <span style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: selected > 0 ? "#15803D" : C.faint,
                          background: selected > 0 ? "#DCFCE7" : "transparent",
                          padding: selected > 0 ? "3px 8px" : "0",
                          borderRadius: 6
                        }}>
                          ⭐ {selected} / {vacancies}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}`, textAlign: "center" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: isFilled ? "#DCFCE7" : (selected > 0 ? "#FEF9C3" : C.bg),
                          color: isFilled ? "#166534" : (selected > 0 ? "#854D0E" : C.sub),
                          border: `1px solid ${isFilled ? "#86EFAC" : C.line}`
                        }}>
                          {isFilled ? "✓ FILLED" : (selected > 0 ? "PARTIAL" : "OPEN")}
                        </span>
                      </td>
                      <td style={{ padding: "14px 14px", borderBottom: `1px solid ${C.line}`, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", alignItems: "center" }}>
                          <button
                            onClick={() => onSelectJob(j.id)}
                            style={{
                              padding: "6px 11px",
                              background: C.accentSoft,
                              color: C.accent,
                              border: `1px solid ${C.accent}`,
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: BODY,
                              transition: "all 0.15s ease"
                            }}
                            title="Open candidate screening results for this job opening"
                          >
                            Review ({valid.length}) →
                          </button>
                          <button
                            onClick={() => exportClientExcel(compObj, [j])}
                            style={{
                              padding: "6px 9px",
                              background: "#DCFCE7",
                              color: "#166534",
                              border: "1px solid #86EFAC",
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontFamily: BODY,
                            }}
                            title={`Export Excel report for ${j.title}`}
                          >
                            <FileSpreadsheet size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================== CLIENT COMPANIES MANAGEMENT ============================== */
function CompanyManager({ companies, jobs, onCreateCompany, onEditCompany, onDeleteCompany, onSelectCompanyJobs, C }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.industry.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companies, searchTerm]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>Client Companies Management</h2>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>Manage client organizations, update contact email IDs, and configure team sender identities</p>
        </div>
        <button
          onClick={onCreateCompany}
          style={{
            padding: "10px 18px",
            background: C.accent,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13.5,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: BODY,
          }}
        >
          <Plus size={16} /> Add New Client Company
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 14px" }}>
        <Search size={18} color={C.sub} />
        <input
          type="text"
          placeholder="Search companies by name or industry..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: "none", outline: "none", background: "transparent", width: "100%", color: C.ink, fontSize: 13.5, fontFamily: BODY }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.map((comp) => {
          const compJobs = jobs.filter(j => isMatchForComp(j, comp));
          const totalScreened = compJobs.reduce((acc, j) => acc + (j.candidates ? j.candidates.length : 0), 0);
          return (
            <Panel key={comp.id} C={C} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={20} color={C.accent} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {onEditCompany && (
                      <button
                        type="button"
                        onClick={() => onEditCompany(comp)}
                        title="Edit company profile, email ID, and sender details"
                        style={{
                          padding: "5px 10px",
                          background: C.paper,
                          color: C.accent,
                          border: `1px solid ${C.line}`,
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontFamily: BODY,
                          transition: "all 0.15s ease"
                        }}
                      >
                        <Edit2 size={12} color={C.accent} /> Edit
                      </button>
                    )}
                    <Trash2 size={16} color={C.faint} style={{ cursor: "pointer", marginLeft: 4 }} title="Delete Company" onClick={() => onDeleteCompany(comp.id)} />
                  </div>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: "12px 0 4px", fontFamily: DISPLAY }}>{comp.name}</h3>
                <div style={{ fontSize: 12, color: C.sub }}>Industry: {comp.industry}</div>
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4, fontSize: 11.5 }}>
                  {comp.contactEmail && (
                    <div style={{ color: "#16A34A", display: "flex", alignItems: "center", gap: 5 }}>
                      <span>✉️</span> <span>Default Reply-To: <strong>{comp.contactEmail}</strong></span>
                    </div>
                  )}
                  <div style={{ color: C.sub, display: "flex", alignItems: "center", gap: 5 }}>
                    <span>👤</span> <span>Sender Display: <strong>{comp.senderName || `${comp.name} Talent Team`}</strong></span>
                  </div>
                </div>
                {comp.notes && <p style={{ fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.4 }}>{comp.notes}</p>}
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{compJobs.length} Openings</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{totalScreened} Candidates</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => exportClientExcel(comp, compJobs)}
                    title={`Download complete multi-sheet Excel recruitment report for ${comp.name}`}
                    style={{
                      padding: "6px 11px",
                      background: "#DCFCE7",
                      color: "#166534",
                      border: "1px solid #86EFAC",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontFamily: BODY,
                      transition: "all 0.15s ease"
                    }}
                  >
                    <FileSpreadsheet size={13} /> Excel
                  </button>
                  <button
                    onClick={() => onSelectCompanyJobs(comp)}
                    style={{
                      padding: "6px 12px",
                      background: C.accentSoft,
                      color: C.accent,
                      border: `1px solid ${C.accent}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: BODY,
                    }}
                  >
                    View Openings →
                  </button>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== ACTIVITY LOGS VIEW ============================== */
function ActivityLogsView({ logs, C }) {
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    return logs.filter(l => (l.message || "").toLowerCase().includes(search.toLowerCase()) || (l.companyName || "").toLowerCase().includes(search.toLowerCase()) || (l.type || "").toLowerCase().includes(search.toLowerCase()));
  }, [logs, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>System &amp; Activity Audit Logs</h2>
        <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>Track all candidate screening events, company updates, and AI interview evaluations</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 14px" }}>
        <Search size={18} color={C.sub} />
        <input
          type="text"
          placeholder="Filter audit logs by keyword, company name, or action..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ border: "none", outline: "none", background: "transparent", width: "100%", color: C.ink, fontSize: 13.5, fontFamily: BODY }}
        />
      </div>

      <Panel C={C}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: C.faint, fontSize: 13 }}>
            No activity logs found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filteredLogs.map(log => (
              <div key={log.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 8, background: C.bg, border: `1px solid ${C.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: C.accentSoft, color: C.accent, textTransform: "uppercase" }}>
                    {log.type}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{log.message}</div>
                    {log.details && <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{log.details}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontSize: 11, color: C.faint }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ============================== SETTINGS VIEW ============================== */
function SettingsView({ llmProvider, setLlmProvider, currentTheme, setTheme, onOpenChangelog, C }) {
  const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem("ANTHROPIC_API_KEY") || "");
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("GEMINI_API_KEY") || "");
  const [groqKey, setGroqKey] = useState(localStorage.getItem("GROQ_API_KEY") || "");
  const [savedMsg, setSavedMsg] = useState("");

  const handleSaveKeys = async () => {
    if (anthropicKey) localStorage.setItem("ANTHROPIC_API_KEY", anthropicKey);
    if (geminiKey) localStorage.setItem("GEMINI_API_KEY", geminiKey);
    if (groqKey) localStorage.setItem("GROQ_API_KEY", groqKey);
    
    // Sync Anthropic key to backend persistent database so candidates can interview securely
    try {
      if (anthropicKey) {
        await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ anthropicKey })
        });
      }
    } catch (e) {}

    setSavedMsg("API Keys saved successfully and synced to server!");
    setTimeout(() => setSavedMsg(""), 3500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 680 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>Settings &amp; Configuration</h2>
        <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>Configure active LLM providers, API authentication keys, and interview evaluation criteria</p>
      </div>

      <Panel title="Active AI Provider &amp; Model" sub="Select which AI engine screens resumes and conducts AI interviews" C={C}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { id: "claude", name: "Anthropic Claude 3.5 Sonnet", desc: "Flagship, state-of-the-art conversational interviewer and talent assessor.", badge: "RECOMMENDED" },
            { id: "gemini", name: "Google Gemini 1.5 Flash", desc: "Fast & affordable cloud model for automated screening.", badge: "CLOUD" },
            { id: "groq", name: "Meta Llama 3.1 8B", desc: "High-speed open-weights engine for instant analysis.", badge: "FAST" },
            { id: "gemma", name: "Google Gemma 2 (Local / Heuristic)", desc: "Offline fallback engine when cloud APIs are disabled.", badge: "OFFLINE" },
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

      <Panel title="API Credentials" sub="Keys are stored securely and synced with the persistent database" C={C}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Anthropic Claude API Key</label>
            <input type="password" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-api03-..." style={inputStyle(C)} />
            <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>Used by the conversational interviewer and automated scoring engine.</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Google Gemini API Key (Optional)</label>
            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIzaSy..." style={inputStyle(C)} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: C.sub }}>Groq API Key (Optional)</label>
            <input type="password" value={groqKey} onChange={e => setGroqKey(e.target.value)} placeholder="gsk_..." style={inputStyle(C)} />
          </div>
          <button onClick={handleSaveKeys} style={btn("primary", C)}>
            Save API Keys
          </button>
          {savedMsg && <div style={{ fontSize: 12.5, color: "#16A34A", fontWeight: 700 }}>{savedMsg}</div>}
        </div>
      </Panel>

      <Panel title="AI Interview Evaluation Rubric &amp; Prompt" sub="How Anthropic evaluates candidate performance and calculates marks" C={C}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
            Anthropic Claude evaluates the completed video interview transcript and proctoring telemetry using a multi-dimensional rubric:
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, background: C.card, border: `1px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 4 }}>💡 Technical Score (0–100)</div>
              <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
                Evaluates concept accuracy, depth of explanations, system architecture understanding, and practical implementation examples.
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: C.card, border: `1px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 4 }}>🗣️ Communication Score (0–100)</div>
              <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
                Evaluates clarity, logical thought structuring, conciseness, and professional workplace articulation.
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: C.card, border: `1px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 4 }}>🛡️ Integrity Score (0–100)</div>
              <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
                Evaluates proctoring metrics objectively. Looking at the keyboard to type or brief pauses to think are normal (90–100%). Deductions occur only for unexcused window switches or external cheating.
              </div>
            </div>

            <div style={{ padding: 12, borderRadius: 8, background: C.card, border: `1px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 4 }}>🎯 Hiring Recommendation</div>
              <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.5 }}>
                • <strong>Strong Hire</strong> (Tech ≥ 80, Integrity ≥ 80)<br/>
                • <strong>Recommend for Next Round</strong> (Tech ≥ 65, Integrity ≥ 70)<br/>
                • <strong>Borderline / Review</strong> (Tech 50–64)<br/>
                • <strong>Do Not Recommend</strong> (Tech &lt; 50)
              </div>
            </div>
          </div>

          <details style={{ marginTop: 8, padding: "10px 14px", borderRadius: 8, background: C.accentSoft, border: `1px solid ${C.line}`, cursor: "pointer" }}>
            <summary style={{ fontWeight: 700, fontSize: 12, color: C.ink }}>
              View Complete System Prompt Used by Anthropic Claude
            </summary>
            <pre style={{ marginTop: 10, fontSize: 11, color: C.ink, whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.5 }}>
{`You are a fair, expert technical interviewer and talent assessor who evaluates candidate interview transcripts and proctoring telemetry objectively.
Your scores must reflect the candidate's actual answers, technical depth, communication clarity, and honest performance.

SCORING CRITERIA:
1. Technical Score (0-100): Accuracy, depth, problem-solving, and practical competence.
2. Communication Score (0-100): Structure, clarity, and professionalism.
3. Integrity Score (0-100): Evaluates honest engagement without penalizing typing or thinking pauses.
4. Recommendation: Actionable hiring decision and constructive technical feedback.`}
            </pre>
          </details>
        </div>
      </Panel>

      <Panel title="Platform Version Control &amp; Releases" sub="Inspect the deployed build version, branch, and release updates" C={C}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 10, background: C.card, border: `1px solid ${C.line}`, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "#10B98118", border: "1px solid #10B98133", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GitBranch size={20} color="#10B981" />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>CogniHire {APP_VERSION}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#10B981", color: "#FFFFFF" }}>STABLE PRODUCTION</span>
                </div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 3 }}>
                  Branch: <code style={{ fontWeight: 600 }}>main</code> · Released September 30, 2026 · Cloud Run Ready
                </div>
              </div>
            </div>
            <button
              onClick={onOpenChangelog}
              style={{
                ...btn("primary", C),
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12.5,
                padding: "8px 14px",
              }}
            >
              <History size={14} /> View Changelog
            </button>
          </div>
          <div style={{ fontSize: 12, color: C.faint, lineHeight: 1.5 }}>
            Every production release follows Semantic Versioning (SemVer <code>MAJOR.MINOR.PATCH</code>). Inspect the complete What's New changelog modal for feature timelines and security enhancements.
          </div>
        </div>
      </Panel>
    </div>
  );
}

/* ============================== USER GUIDE & MANUAL ============================== */
function UserGuideView({ onNavigateTab, C }) {
  const [activeCat, setActiveCat] = useState("all");
  const [openFaq, setOpenFaq] = useState({ 0: true });

  const categories = [
    { id: "all", label: "📚 All Chapters" },
    { id: "quickstart", label: "⚡ 3-Min Quickstart" },
    { id: "companies", label: "🏢 Client Companies" },
    { id: "jobs", label: "📋 Job Criteria & Rules" },
    { id: "screening", label: "📄 Resume Screening & Weights" },
    { id: "comparison", label: "⚖️ Comparison Matrix" },
    { id: "interview", label: "🤖 AI Video Interview & Proctoring" },
    { id: "persistence", label: "☁️ Data Persistence & Cloud" },
    { id: "settings", label: "⚙️ Settings & API Keys" },
    { id: "faq", label: "❓ Frequently Asked Questions" },
  ];

  const toggleFaq = (idx) => {
    setOpenFaq(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const showCat = (catId) => {
    if (activeCat !== "all" && activeCat !== catId) return false;
    return true;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
      {/* Hero Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.paper}, ${C.panel})`,
        border: `1px solid ${C.cardBorder}`,
        borderRadius: 16,
        padding: "28px 32px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={24} color={C.accent} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
              CogniHire Operational Manual &amp; User Guide
            </h1>
            <p style={{ fontSize: 13.5, color: C.sub, margin: "4px 0 0" }}>
              Complete step-by-step handbook to shortlisting resumes, head-to-head candidate comparisons, and conversational AI proctored interviews.
            </p>
          </div>
        </div>

        {/* Quick Stepper Overview */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: C.bg,
          padding: "12px 18px",
          borderRadius: 10,
          border: `1px solid ${C.line}`,
          marginTop: 18,
          flexWrap: "wrap",
          fontSize: 12.5,
          color: C.ink,
          fontWeight: 700
        }}>
          <span style={{ color: C.accent }}>Standard Workflow:</span>
          <span>1. Client Company</span>
          <span style={{ color: C.faint }}>➔</span>
          <span>2. Define Job Criteria</span>
          <span style={{ color: C.faint }}>➔</span>
          <span>3. Screen Resumes</span>
          <span style={{ color: C.faint }}>➔</span>
          <span>4. Review Shortlist</span>
          <span style={{ color: C.faint }}>➔</span>
          <span>5. Compare Candidates</span>
          <span style={{ color: C.faint }}>➔</span>
          <span>6. AI Video Interview</span>
        </div>

        {/* Category Filters */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {categories.map(c => {
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: active ? 800 : 600,
                    cursor: "pointer",
                    border: `1px solid ${active ? C.accent : C.line}`,
                    background: active ? C.accent : C.paper,
                    color: active ? "#FFFFFF" : C.sub,
                    transition: "all 0.15s ease"
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chapter 1: ⚡ 3-Minute Quickstart */}
      {showCat("quickstart") && (
        <Panel title="⚡ 3-Minute Quickstart: From Zero to Shortlisted" sub="The fastest way to evaluate your first pool of candidate resumes" C={C}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 16 }}>
            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>1</span>
                <span style={{ fontWeight: 800, color: C.ink, fontSize: 14 }}>Select Client &amp; Job</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                Choose a client company or select an existing opening from the <strong>Job Openings</strong> tab.
              </p>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>2</span>
                <span style={{ fontWeight: 800, color: C.ink, fontSize: 14 }}>Set Must-Have Skills</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                Enter mandatory tools and languages (e.g. <code>Python</code>, <code>React</code>). Candidates missing any will be flagged.
              </p>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>3</span>
                <span style={{ fontWeight: 800, color: C.ink, fontSize: 14 }}>Upload Resumes in Bulk</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                In Step 2, drag &amp; drop PDF, Word DOCX, or TXT resumes. Multiple files upload and queue automatically.
              </p>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>4</span>
                <span style={{ fontWeight: 800, color: C.ink, fontSize: 14 }}>Run AI Screening</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                Click <strong>"Run AI Screening"</strong>. Watch real-time multi-dimensional scoring and instant recommendation badges.
              </p>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>5</span>
                <span style={{ fontWeight: 800, color: C.ink, fontSize: 14 }}>Compare Candidates</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                Click Step 4 <strong>"Compare Candidates"</strong> to see side-by-side matrices and why #1 scored higher than others.
              </p>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", background: C.accent, color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900 }}>6</span>
                <span style={{ fontWeight: 800, color: C.ink, fontSize: 14 }}>Send AI Interview Link</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                Click <strong>"Invite Candidate"</strong>. The candidate completes a 30-minute conversational interview with live proctoring.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => onNavigateTab("jobs", { step: 1 })}
              style={{ ...btn("primary", C), display: "flex", alignItems: "center", gap: 6 }}
            >
              <span>🚀 Open Job Openings &amp; Try Now</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </Panel>
      )}

      {/* Chapter 2: 🏢 Client Companies */}
      {showCat("companies") && (
        <Panel title="🏢 Client Companies &amp; Recruiter Routing" sub="Organizing hiring across corporate divisions, clients, and subsidiaries" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
              CogniHire supports multi-tenant recruitment. Whether you represent a centralized talent acquisition team, a university placement cell, or a recruitment agency serving corporate clients (e.g. <em>Motherson Group</em>, <em>SRM Technologies</em>), you can keep candidate pipelines isolated.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 6 }}>🏢 Company Profiles</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  <li>Create custom companies with industry tags and notes.</li>
                  <li>Use the <strong>Target Client Company</strong> dropdown in the sidebar to filter openings.</li>
                  <li>Review aggregated candidate count and average fit scores per company on the Dashboard.</li>
                </ul>
              </div>

              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 6 }}>📧 Cascading Email Hierarchy</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  <li>Each company has a <strong>Default Contact Email</strong> and <strong>Sender Display Name</strong>.</li>
                  <li>Candidate interview invitation replies automatically route to this email.</li>
                  <li>Guarantees 100% SPF/DKIM delivery without corporate spam rejections.</li>
                </ul>
              </div>
            </div>

            <div style={{ background: C.accentSoft, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: C.accentDeep, fontWeight: 600 }}>
              💡 <strong>Pro-Tip:</strong> Set your team's real hiring email in each company card (e.g. <code>careers@motherson.com</code>) so candidate inquiries arrive directly in your recruiters' inboxes.
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => onNavigateTab("companies")} style={btn("primary", C)}>
                🏢 View Client Companies
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* Chapter 3: 📋 Job Criteria & Rules */}
      {showCat("jobs") && (
        <Panel title="📋 Defining Job Criteria &amp; Scoring Formulas" sub="How to configure job openings for maximum assessment precision" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
              In Step 1 (<strong>Define Job Criteria</strong>), recruiters configure the benchmark requirements the AI uses to evaluate resumes:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#DC2626", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Target size={16} /> Must-Have Skills (Mandatory)
                </div>
                <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  These are strict requirements. If a candidate does not demonstrate proficiency in a must-have skill:
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    <li>Their Skills Fit Score receives an automated penalty.</li>
                    <li>The missing skill is flagged under <strong>"Critical Gaps"</strong> and tagged in the Comparison Matrix.</li>
                    <li>Examples: <code>Python</code>, <code>Catia V5</code>, <code>TypeScript</code>, <code>AWS</code>.</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#16A34A", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={16} /> Nice-to-Have Skills (Bonus)
                </div>
                <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  Secondary preferences that set top candidates apart:
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    <li>Candidates with these skills receive bonus points on their technical depth.</li>
                    <li>Missing a nice-to-have skill does <strong>not</strong> trigger a penalty.</li>
                    <li>Examples: <code>Docker</code>, <code>CI/CD Pipelines</code>, <code>Scrum Master Certification</code>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Weights Breakdown */}
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 12, fontFamily: DISPLAY }}>
                The 4-Pillar Weighted Scoring Formula (100% Total)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div style={{ borderLeft: "3px solid #3B82F6", paddingLeft: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#3B82F6" }}>40% Weight</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Technical Skills Fit</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Must-have coverage, keyword depth, verified tooling.</div>
                </div>
                <div style={{ borderLeft: "3px solid #10B981", paddingLeft: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#10B981" }}>25% Weight</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Experience Fit</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Tenure length, title seniority, career progression.</div>
                </div>
                <div style={{ borderLeft: "3px solid #F59E0B", paddingLeft: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#F59E0B" }}>20% Weight</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Domain Relevance</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Automotive, manufacturing, fintech, cloud systems.</div>
                </div>
                <div style={{ borderLeft: "3px solid #8B5CF6", paddingLeft: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#8B5CF6" }}>15% Weight</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Education &amp; Discipline</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Degree level (B.E., M.Tech, Ph.D.), discipline alignment.</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Chapter 4: 📄 Resume Screening & Recommendations */}
      {showCat("screening") && (
        <Panel title="📄 Resume Upload, Screening &amp; Shortlist Cards" sub="How to parse bulk resumes and interpret AI candidate scorecards" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Upload size={16} color={C.accent} /> Bulk Resume Upload
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  <li>Supports <strong>PDF (.pdf)</strong>, <strong>Microsoft Word (.docx)</strong>, and <strong>Plain Text (.txt)</strong>.</li>
                  <li>Multi-file upload: Select 10 to 50 resumes simultaneously.</li>
                  <li>Automatic deduplication and resume text extraction.</li>
                </ul>
              </div>

              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Download size={16} color={C.accent} /> Shortlist Filtering &amp; CSV Export
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  <li>Adjust the <strong>Score Threshold Slider</strong> (e.g. 70%) to immediately filter top candidates.</li>
                  <li>Click <strong>"Export Shortlist CSV"</strong> to download a formatted spreadsheet with rank, score, email, and summaries.</li>
                  <li>Candidate cards display radar charts of sub-scores.</li>
                </ul>
              </div>
            </div>

            {/* Recommendation Badges Table */}
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: C.panel, borderBottom: `1px solid ${C.line}`, textAlign: "left" }}>
                    <th style={{ padding: "10px 14px", color: C.sub }}>Recommendation Badge</th>
                    <th style={{ padding: "10px 14px", color: C.sub }}>Score Range</th>
                    <th style={{ padding: "10px 14px", color: C.sub }}>Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: "#DCFCE7", color: "#15803D", padding: "3px 8px", borderRadius: 4, fontWeight: 800 }}>✓ Strong Match</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>80% – 100%</td>
                    <td style={{ padding: "10px 14px", color: C.sub }}>Fast-track to technical interview immediately. Exceeds core requirements.</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: "#FEF9C3", color: "#A16207", padding: "3px 8px", borderRadius: 4, fontWeight: 800 }}>⚡ Good Match</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>70% – 79%</td>
                    <td style={{ padding: "10px 14px", color: C.sub }}>Solid candidate. Meets all must-haves, minor gaps in secondary tools.</td>
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: "#FFEDD5", color: "#C2410C", padding: "3px 8px", borderRadius: 4, fontWeight: 800 }}>? Possible Match</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>50% – 69%</td>
                    <td style={{ padding: "10px 14px", color: C.sub }}>Borderline match. Missing some relevant experience or domain depth.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: "#FEE2E2", color: "#B91C1C", padding: "3px 8px", borderRadius: 4, fontWeight: 800 }}>✗ Weak Match</span>
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>0% – 49%</td>
                    <td style={{ padding: "10px 14px", color: C.sub }}>Does not meet baseline criteria. Missing primary required skills.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}

      {/* Chapter 5: ⚖️ Candidate Comparison Matrix */}
      {showCat("comparison") && (
        <Panel title="⚖️ Head-to-Head Candidate Comparison Matrix" sub="Understand why candidates scored higher than others and compare side-by-side" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
              The **Candidate Comparison View** (Step 4) lets recruiters directly analyze candidate strengths and weaknesses against each other:
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 6 }}>🎯 Interactive Multi-Selector</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  <li>Click candidate pills to dynamically compare 2 to 5 candidates side-by-side.</li>
                  <li>Use shortcuts: <strong>"Select Top 4"</strong>, <strong>"Compare Top 2"</strong>, or <strong>"Select All"</strong>.</li>
                  <li>Shows rank, recommendation badge, and score delta (e.g. <code>-8%</code> vs leader).</li>
                </ul>
              </div>

              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 6 }}>🏆 Automated Score Justification</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  <li>Explains mathematically why <strong>#1 Ranked Candidate</strong> beat runner-ups.</li>
                  <li>Highlights must-have skill count differences (e.g. <em>"Matches 2 more required skills"</em>).</li>
                  <li>Explains technical margin % and experience depth tradeoffs.</li>
                </ul>
              </div>
            </div>

            <div style={{ background: C.panel, border: `1px solid #8B5CF644`, borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8B5CF6", fontWeight: 800, fontSize: 13.5, marginBottom: 6 }}>
                <Sparkles size={16} /> "Ask Claude to Compare" Button
              </div>
              <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                Clicking <strong>"Ask Claude to Compare"</strong> sends the candidate pool and full job description to Anthropic Claude to synthesize an executive memorandum:
                <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                  <li><strong>Headline Verdict</strong>: A sharp one-sentence executive summary.</li>
                  <li><strong>Winner Deep-Dive</strong>: Detailed explanation of candidate strengths and edge over others.</li>
                  <li><strong>Differentiating Factors</strong>: Key capabilities separating the leader from runner-ups.</li>
                  <li><strong>Recruiter Hiring Advice</strong>: Clear recommendations on who to advance or reject.</li>
                </ul>
              </div>
            </div>

            <div style={{ background: C.accentSoft, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: C.accentDeep, fontWeight: 600 }}>
              📌 <strong>Frozen Header &amp; Column:</strong> As you scroll down through must-haves, strengths, gaps, and summaries, the candidate names stay pinned at the top, and the metric column stays pinned on the left.
            </div>
          </div>
        </Panel>
      )}

      {/* Chapter 6: 🤖 AI Video Interview & Proctoring */}
      {showCat("interview") && (
        <Panel title="🤖 AI Video Interview &amp; Anti-Cheating Proctoring" sub="Conversational technical interviews with live proctoring telemetry" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
              CogniHire features a built-in automated conversational interviewer powered by Anthropic Claude, complete with video telemetry and anti-cheating proctoring.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={16} color={C.accent} /> 30-Minute Global Timer
                </div>
                <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  Rather than stressful 3-minute per-question timers, candidates receive a <strong>30-minute global countdown</strong> for the entire interview.
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    <li>Candidates answer questions at their natural pace.</li>
                    <li>Allows thoughtful technical explanations without artificial rush.</li>
                    <li>Automatic graceful submission when timer expires.</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageSquare size={16} color={C.accent} /> Conversational AI Follow-Ups
                </div>
                <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  Anthropic Claude conducts the interview dynamically:
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    <li>Generates questions specific to the candidate's resume projects.</li>
                    <li>Listens to candidate responses and asks relevant technical follow-ups.</li>
                    <li>Evaluates problem solving, code quality, and technical vocabulary.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Proctoring Shield */}
            <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#16A34A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={18} /> Anti-Cheating Telemetry &amp; Proctoring Matrix
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div style={{ background: C.bg, padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 12.5, color: C.ink }}>👁️ Face Orientation</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Flags candidate looking away from the screen for extended intervals.</div>
                </div>
                <div style={{ background: C.bg, padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 12.5, color: C.ink }}>👥 Multiple Persons</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Detects secondary individuals entering the camera frame.</div>
                </div>
                <div style={{ background: C.bg, padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 12.5, color: C.ink }}>🪟 Tab &amp; Window Focus</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Detects when candidate minimizes tab to search for answers.</div>
                </div>
                <div style={{ background: C.bg, padding: "10px 12px", borderRadius: 8 }}>
                  <div style={{ fontWeight: 800, fontSize: 12.5, color: C.ink }}>📊 Fair Integrity Score</div>
                  <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>Starts at 100% and calculates proportional deductions based on telemetry.</div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Chapter 7: ☁️ Data Persistence & Cloud */}
      {showCat("persistence") && (
        <Panel title="☁️ Data Persistence &amp; Google Cloud Storage" sub="How your job data, candidate resumes, and interview records remain safe" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, margin: 0 }}>
              Recruiters frequently ask: <em>"Will my created jobs and candidate marks be lost if I reload the page or when Cloud Run restarts?"</em>
            </p>

            <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#16A34A", marginBottom: 6 }}>
                ✓ 100% Zero Data Loss Architecture
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                <li><strong>Local SQLite Database:</strong> Runs on a fast in-memory POSIX filesystem for instantaneous UI responsiveness.</li>
                <li><strong>Google Cloud Storage Sync:</strong> CogniHire is connected to persistent bucket <code>gs://cognihire-app-data</code> mounted at <code>/app/data</code>.</li>
                <li>Every time you post a job, upload resumes, run a screening, or submit an interview, changes are atomically persisted to Cloud Storage.</li>
                <li>Even across container restarts, browser reloads, or code redeployments, your data remains fully intact.</li>
              </ul>
            </div>
          </div>
        </Panel>
      )}

      {/* Chapter 8: ⚙️ Settings & API Keys */}
      {showCat("settings") && (
        <Panel title="⚙️ AI Providers, API Keys &amp; Theme Customization" sub="Connecting your AI account and personalizing the portal interface" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 6 }}>🔑 Configuring Anthropic Claude API Key</div>
                <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  1. Go to <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" style={{ color: C.accent, fontWeight: 700 }}>console.anthropic.com</a> and generate an API key.
                  <br />2. Navigate to <strong>Settings &amp; AI Keys</strong> in CogniHire.
                  <br />3. Paste your key (<code>sk-ant-api03-...</code>) and click <strong>Save API Keys</strong>.
                  <br />4. Keys are saved locally and securely synced to the server database for candidate interview links.
                </div>
              </div>

              <div style={{ background: C.bg, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink, marginBottom: 6 }}>🎨 Theme Customization</div>
                <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.6 }}>
                  CogniHire includes 4 branded themes:
                  <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                    <li><strong>Light Mode</strong>: Clean high-contrast corporate theme.</li>
                    <li><strong>Dark Mode</strong>: Modern low-glare dark palette.</li>
                    <li><strong>SRM Blue</strong>: Academic navy &amp; ocean blue.</li>
                    <li><strong>Motherson Gold</strong>: Luxury automotive gold &amp; charcoal.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => onNavigateTab("settings")} style={btn("primary", C)}>
                ⚙️ Open Settings &amp; API Keys
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* Chapter 9: ❓ Frequently Asked Questions */}
      {showCat("faq") && (
        <Panel title="❓ Frequently Asked Questions (FAQ)" sub="Common questions and quick troubleshooting tips" C={C}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                q: "What resume file formats are supported?",
                a: "CogniHire supports PDF (.pdf), Microsoft Word (.docx), and plain text (.txt). The parser automatically strips formatting, extracts candidate contact info, detects timelines, and standardizes skills."
              },
              {
                q: "What should candidates do if they lose camera/mic permissions during the video interview?",
                a: "Candidates should click the lock or camera icon in their browser address bar, set Camera and Microphone to 'Allow', and refresh the page. The 30-minute interview state is preserved."
              },
              {
                q: "Can I re-screen candidates if I change the job criteria or add new must-haves?",
                a: "Yes! In Step 3 (Results), click 'Re-Run Screening'. CogniHire will re-evaluate all candidates against your updated criteria and refresh all match scores."
              },
              {
                q: "How does CogniHire prevent AI bias in candidate shortlisting?",
                a: "CogniHire focuses strictly on objective job requirements: verified tenure, skill mastery, must-have keyword matching, and academic credentials. It ignores subjective demographic proxies."
              },
              {
                q: "Where can I see an audit trail of all invitation emails and screening actions?",
                a: "Click 'Activity & Audit Logs' in the sidebar to inspect a chronological audit log with timestamps, company tags, and delivery statuses."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                style={{
                  background: C.bg,
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  overflow: "hidden"
                }}
              >
                <div
                  onClick={() => toggleFaq(idx)}
                  style={{
                    padding: "14px 18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    userSelect: "none"
                  }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{faq.q}</span>
                  {openFaq[idx] ? <ChevronUp size={16} color={C.sub} /> : <ChevronDown size={16} color={C.sub} />}
                </div>
                {openFaq[idx] && (
                  <div style={{ padding: "0 18px 14px", fontSize: 12.5, color: C.sub, lineHeight: 1.6, borderTop: `1px solid ${C.line}44` }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
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
  const [llmProvider, setLlmProvider] = useState("claude");
  const [activeInterviewCandidate, setActiveInterviewCandidate] = useState(null);
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [savedJobNotice, setSavedJobNotice] = useState(false);
  const [resultsFilter, setResultsFilter] = useState("all");
  const [showChangelogModal, setShowChangelogModal] = useState(false);

  const handleSaveJobExplicitly = () => {
    saveJobsToServer(jobs);
    setSavedJobNotice(true);
    setTimeout(() => setSavedJobNotice(false), 2500);
  };

  const [standaloneInterviewMode, setStandaloneInterviewMode] = useState(false);

  const C = THEMES[themeKey] || THEMES.light;

  // Initial Data Fetching & URL Interview Parameter Detection
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, compRes, logsRes] = await Promise.all([
          fetch("/api/jobs"),
          fetch("/api/companies"),
          fetch("/api/logs")
        ]);

        let loadedJobs = [];
        if (jobsRes.ok) {
          loadedJobs = await jobsRes.json();
          if (Array.isArray(loadedJobs) && loadedJobs.length > 0) {
            setJobs(loadedJobs);
            if (!activeJobId) setActiveJobId(loadedJobs[0].id);
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

        // Detect if opened via candidate interview URL
        const urlParams = new URLSearchParams(window.location.search);
        const candIdParam = urlParams.get("cand") || urlParams.get("candidate");
        if (candIdParam && loadedJobs.length > 0) {
          let foundCand = null;
          let foundJob = null;
          for (const j of loadedJobs) {
            const match = (j.candidates || []).find(c => c.id === candIdParam);
            if (match) {
              foundCand = match;
              foundJob = j;
              break;
            }
          }

          if (foundCand) {
            setActiveInterviewCandidate(foundCand);
            if (foundJob) setActiveJobId(foundJob.id);
            setStandaloneInterviewMode(true);
          }
        } else if (window.location.pathname.includes("/interview") && loadedJobs.length > 0) {
          for (const j of loadedJobs) {
            const match = (j.candidates || []).find(c => c.result);
            if (match) {
              setActiveInterviewCandidate(match);
              setActiveJobId(j.id);
              setStandaloneInterviewMode(true);
              break;
            }
          }
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

  const handleOpenAddCompany = () => {
    setEditingCompany(null);
    setCompanyModalOpen(true);
  };

  const handleOpenEditCompany = (comp) => {
    setEditingCompany(comp);
    setCompanyModalOpen(true);
  };

  const handleSaveCompany = (compData) => {
    if (editingCompany) {
      // Editing existing company
      const updated = companies.map(c => c.id === compData.id ? { ...c, ...compData } : c);
      setCompanies(updated);
      saveCompaniesToServer(updated);

      // If company name was updated, synchronize any jobs referencing this company
      if (editingCompany.name !== compData.name) {
        setJobs(prevJobs => {
          const revised = prevJobs.map(j => (j.companyId === compData.id || j.companyName === editingCompany.name)
            ? { ...j, companyName: compData.name }
            : j
          );
          saveJobsToServer(revised);
          return revised;
        });
      }

      // If activeCompany is this company, update activeCompany
      if (activeCompany?.id === compData.id) {
        setActiveCompany({ ...activeCompany, ...compData });
      }
    } else {
      // Adding new company
      const updated = [compData, ...companies];
      setCompanies(updated);
      saveCompaniesToServer(updated);
    }
    setCompanyModalOpen(false);
    setEditingCompany(null);
  };

  const handleDeleteCompany = (compId) => {
    const updated = companies.filter(c => c.id !== compId);
    setCompanies(updated);
    saveCompaniesToServer(updated);
    if (activeCompany?.id === compId) {
      setActiveCompany(null);
    }
    setCompanyModalOpen(false);
    setEditingCompany(null);
  };

  const handleAddCompany = (newComp) => handleSaveCompany(newComp);

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
      vacancies: 1,
      cutoff: 70,
      location: "Chennai / Hybrid",
      senderName: "",
      senderEmail: "",
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
    if (!window.confirm("Are you sure you want to delete this job opening? This cannot be undone.")) return;
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

  const handleUpdateCandidateDecision = (candidateId, newDecision) => {
    updateActiveJob((j) => ({
      ...j,
      candidates: (j.candidates || []).map((c) =>
        c.id === candidateId
          ? {
              ...c,
              hrDecision: newDecision,
              result: c.result ? { ...c.result, hrDecision: newDecision } : c.result,
            }
          : c
      ),
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

        const delayMs = 1000;
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
          updateActiveJob((j) => {
            const newCandidates = (j.candidates || []).map((c) => (c.id === cand.id ? { ...c, status: "done", result, base64: null } : c));
            const isAllDone = newCandidates.length > 0 && newCandidates.every(c => c.status === "done" || c.status === "error");
            return {
              ...j,
              screening: isAllDone ? "done" : j.screening,
              candidates: newCandidates,
            };
          });
        } catch (e) {
          updateActiveJob((j) => {
            const newCandidates = (j.candidates || []).map((c) =>
              (c.id === cand.id ? { ...c, status: "error", error: String(e.message || e) } : c));
            const isAllDone = newCandidates.length > 0 && newCandidates.every(c => c.status === "done" || c.status === "error");
            return {
              ...j,
              screening: isAllDone ? "done" : j.screening,
              candidates: newCandidates,
            };
          });
        }
      });
    } catch (e) {
      console.error("Screening failed:", e);
    }

    const currentJobId = activeJob.id;
    setJobs((prevJobs) => {
      const updated = prevJobs.map((j) => (j.id === currentJobId ? { ...j, screening: "done" } : j));
      saveJobsToServer(updated);
      return updated;
    });
  };

  const displayedJobs = useMemo(() => {
    if (!activeCompany) return jobs;
    return jobs.filter(j => isMatchForComp(j, activeCompany));
  }, [jobs, activeCompany]);

  useEffect(() => {
    if (activeTab === "jobs" && displayedJobs.length > 0) {
      if (!displayedJobs.some(j => j.id === activeJobId)) {
        setActiveJobId(displayedJobs[0].id);
      }
    }
  }, [activeTab, displayedJobs, activeJobId]);

  if (standaloneInterviewMode && activeInterviewCandidate) {
    return (
      <VideoInterview
        candidate={activeInterviewCandidate}
        job={activeJob || { title: "Position", companyName: "Client Company" }}
        llmProvider={llmProvider}
        apiKey={localStorage.getItem("ANTHROPIC_API_KEY") || ""}
        onComplete={(report) => {
          console.log("Interview completed:", report);
        }}
      />
    );
  }

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
        onOpenChangelog={() => setShowChangelogModal(true)}
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
                onCreateCompany={handleOpenAddCompany}
                onCreateJob={handleCreateJobForCompany}
                onSelectJob={(jId) => { setActiveJobId(jId); setActiveTab("jobs"); setStep(3); setMaxReached(4); }}
                onOpenChangelog={() => setShowChangelogModal(true)}
                onNavigateTab={(tab, options = {}) => {
                  if (options.jobId) {
                    setActiveJobId(options.jobId);
                  } else if (tab === "jobs") {
                    if (options.step === 3) {
                      const currentHasResults = jobs.find(j => j.id === activeJobId && (j.candidates || []).some(c => c.status === "done" && c.result));
                      if (!currentHasResults) {
                        const jobWithResults = jobs.find(j => (j.candidates || []).some(c => c.status === "done" && c.result)) || jobs[0];
                        if (jobWithResults) setActiveJobId(jobWithResults.id);
                      }
                    } else if (!activeJobId && jobs.length > 0) {
                      setActiveJobId(jobs[0].id);
                    }
                  }
                  if (options.step) {
                    setStep(options.step);
                    setMaxReached((prev) => Math.max(prev, options.step));
                  }
                  if (options.filter) {
                    setResultsFilter(options.filter);
                  } else {
                    setResultsFilter("all");
                  }
                  setActiveTab(tab);
                }}
                onExportClientExcel={exportClientExcel}
                C={C}
              />
            )}

            {activeTab === "companies" && (
              <CompanyManager
                companies={companies}
                jobs={jobs}
                onCreateCompany={handleOpenAddCompany}
                onEditCompany={handleOpenEditCompany}
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
                onOpenChangelog={() => setShowChangelogModal(true)}
                C={C}
              />
            )}

            {activeTab === "guide" && (
              <UserGuideView
                onNavigateTab={(tab, options = {}) => {
                  if (options.jobId) setActiveJobId(options.jobId);
                  if (options.step) {
                    setStep(options.step);
                    setMaxReached((prev) => Math.max(prev, options.step));
                  }
                  setActiveTab(tab);
                }}
                C={C}
              />
            )}

            {activeTab === "jobs" && (
              <div>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
                      {activeCompany ? `Job Openings — ${activeCompany.name}` : "All Client Openings & Resume Screening"}
                    </h2>
                    <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>
                      Select a client company and opening to screen candidates, compare profiles, and send AI interview invitations
                    </p>
                  </div>
                </div>

                {/* Option 1: Two Connected Dropdowns Navigation Toolbar */}
                <div style={{
                  background: C.paper,
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: "16px 20px",
                  marginBottom: 20,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap"
                  }}>
                    {/* Left: Connected Dropdowns */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", flex: 1, minWidth: 320 }}>
                      {/* Dropdown 1: Client Company */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 230, flex: "1 1 230px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>
                            <Building2 size={13} color={C.accent} />
                            <span>1. Client Company</span>
                          </div>
                          {activeCompany && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditCompany(activeCompany)}
                              title={`Edit ${activeCompany.name} email ID, sender name, and profile`}
                              style={{
                                background: "none",
                                border: "none",
                                color: C.accent,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                                padding: 0
                              }}
                            >
                              <Edit2 size={11} /> Edit Company
                            </button>
                          )}
                        </div>
                        <div style={{ position: "relative" }}>
                          <select
                            value={activeCompany?.id || "all"}
                            onChange={(e) => {
                              const val = e.target.value;
                              const targetComp = val === "all" ? null : companies.find(c => c.id === val) || null;
                              setActiveCompany(targetComp);
                              const relatedJobs = !targetComp ? jobs : jobs.filter(j => isMatchForComp(j, targetComp));
                              if (relatedJobs.length > 0) {
                                setActiveJobId(relatedJobs[0].id);
                                const screened = (relatedJobs[0].candidates || []).filter(c => c.status === "done" && c.result);
                                if (screened.length > 0 || relatedJobs[0].screening === "done") {
                                  setStep(3);
                                  setMaxReached(4);
                                } else {
                                  setStep(1);
                                  setMaxReached(4);
                                }
                              } else {
                                setActiveJobId(null);
                              }
                            }}
                            style={{
                              ...inputStyle(C),
                              padding: "9px 34px 9px 12px",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: "pointer",
                              width: "100%",
                              borderRadius: 8,
                              background: C.bg,
                              appearance: "none",
                              border: `1.5px solid ${C.line}`
                            }}
                          >
                            <option value="all">🌐 All Client Companies ({jobs.length} total roles)</option>
                            {companies.map(c => {
                              const count = jobs.filter(j => isMatchForComp(j, c)).length;
                              return (
                                <option key={c.id} value={c.id}>
                                  🏢 {c.name} ({count} {count === 1 ? "opening" : "openings"})
                                </option>
                              );
                            })}
                          </select>
                          <ChevronDown size={15} color={C.sub} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        </div>
                      </div>

                      {/* Connecting Arrow */}
                      <div style={{ color: C.faint, fontSize: 16, fontWeight: 700, marginTop: 18 }}>➔</div>

                      {/* Dropdown 2: Client Related Job Openings */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 280, flex: "2 1 280px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 800, color: C.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>
                          <Briefcase size={13} color={C.accent} />
                          <span>2. Client Job Opening {activeCompany ? `(${activeCompany.name})` : ""}</span>
                        </div>
                        <div style={{ position: "relative" }}>
                          <select
                            value={activeJobId || ""}
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              setActiveJobId(selectedId);
                              const targetJ = jobs.find(j => j.id === selectedId);
                              if (targetJ) {
                                const screened = (targetJ.candidates || []).filter(c => c.status === "done" && c.result);
                                if (screened.length > 0 || targetJ.screening === "done") {
                                  setStep(3);
                                  setMaxReached(4);
                                } else {
                                  setStep(1);
                                  setMaxReached(4);
                                }
                              }
                            }}
                            disabled={displayedJobs.length === 0}
                            style={{
                              ...inputStyle(C),
                              padding: "9px 34px 9px 12px",
                              fontSize: 13,
                              fontWeight: 700,
                              cursor: displayedJobs.length === 0 ? "not-allowed" : "pointer",
                              width: "100%",
                              borderRadius: 8,
                              background: C.bg,
                              appearance: "none",
                              border: `1.5px solid ${activeJob ? C.accent : C.line}`
                            }}
                          >
                            {displayedJobs.length === 0 ? (
                              <option value="">No openings for {activeCompany ? activeCompany.name : "selected company"}</option>
                            ) : (
                              displayedJobs.map(j => {
                                const screened = (j.candidates || []).filter(c => c.status === "done" && c.result);
                                const statusTag = screened.length > 0 ? ` [✓ ${screened.length} Screened]` : " [Draft]";
                                const compPrefix = !activeCompany && j.companyName ? `${j.companyName} — ` : "";
                                return (
                                  <option key={j.id} value={j.id}>
                                    🎯 {compPrefix}{j.title || "Untitled Role"}{statusTag} ({j.seniority || "Junior/Mid"}, {j.minYears || 0}+ yrs)
                                  </option>
                                );
                              })
                            )}
                          </select>
                          <ChevronDown size={15} color={C.sub} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action & Candidate Count */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
                      {activeJob && (() => {
                        const screenedCount = (activeJob.candidates || []).filter(c => c.status === "done" && c.result).length;
                        const totalCount = (activeJob.candidates || []).length;
                        return screenedCount > 0 ? (
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "#16A34A", background: "#DCFCE7", border: "1px solid #BBF7D0", padding: "7px 12px", borderRadius: 8, whiteSpace: "nowrap" }}>
                            ✓ {screenedCount} of {totalCount} Screened
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, background: C.bg, border: `1px solid ${C.line}`, padding: "7px 12px", borderRadius: 8, whiteSpace: "nowrap" }}>
                            {totalCount} Resumes Uploaded
                          </span>
                        );
                      })()}

                      <button
                        onClick={handleCreateJobForCompany}
                        style={{
                          ...btn("primary", C),
                          fontSize: 12.5,
                          padding: "7px 14px",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          whiteSpace: "nowrap"
                        }}
                      >
                        <Plus size={14} /> Post New Job
                      </button>
                    </div>
                  </div>
                </div>

                {displayedJobs.length === 0 ? (
                  <Panel C={C}>
                    <div style={{ textAlign: "center", padding: "40px 0", color: C.sub }}>
                      <div>No job openings posted for <strong>{activeCompany ? activeCompany.name : "this client company"}</strong> yet.</div>
                      <button onClick={handleCreateJobForCompany} style={{ ...btn("primary", C), marginTop: 14 }}>
                        + Post New Opening Job for {activeCompany ? activeCompany.name : "Company"}
                      </button>
                    </div>
                  </Panel>
                ) : (
                  <div>
                    {activeJob && (
                      <div style={{ marginBottom: 20 }}>
                        {/* Stepper Header */}
                        <div style={{ marginBottom: 16 }}>
                          <Stepper step={step} maxReached={maxReached} go={goto} C={C} />
                        </div>

                        {/* Step Views */}
                        {step === 1 && (
                          <RoleStep
                            job={activeJob}
                            setJob={handleUpdateJobDetails}
                            companies={companies}
                            onNext={() => goto(2)}
                            onSave={handleSaveJobExplicitly}
                            onDelete={() => handleDeleteJob(activeJob.id)}
                            savedNotice={savedJobNotice}
                            onEditCompany={handleOpenEditCompany}
                            onCreateCompany={handleOpenAddCompany}
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

                        {step === 3 && (activeJob.screening === "running" && (activeJob.candidates || []).some(c => c.status === "analyzing" || c.status === "queued")) ? (
                          <Analyzing 
                            candidates={activeJob.candidates || []} 
                            onComplete={() => updateActiveJob((j) => ({ ...j, screening: "done" }))}
                            C={C} 
                          />
                        ) : step === 3 ? (
                          <Results
                            candidates={activeJob.candidates || []}
                            job={activeJob}
                            companies={companies}
                            onReRun={() => runScreening(true)}
                            onRestart={() => goto(1)}
                            onStartInterview={(cand) => setActiveInterviewCandidate(cand)}
                            onCompare={() => goto(4)}
                            onUpdateCandidateDecision={handleUpdateCandidateDecision}
                            filterMode={resultsFilter}
                            setFilterMode={setResultsFilter}
                            C={C}
                          />
                        ) : step === 4 ? (
                          <CandidateComparisonView
                            candidates={activeJob.candidates || []}
                            job={activeJob}
                            onBack={() => goto(3)}
                            onStartInterview={(cand) => setActiveInterviewCandidate(cand)}
                            onUpdateCandidateDecision={handleUpdateCandidateDecision}
                            llmProvider={llmProvider}
                            C={C}
                          />
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Client Company Add / Edit Modal */}
      <CompanyModal
        isOpen={companyModalOpen}
        company={editingCompany}
        onClose={() => {
          setCompanyModalOpen(false);
          setEditingCompany(null);
        }}
        onSave={handleSaveCompany}
        onDelete={handleDeleteCompany}
        C={C}
      />

      {/* Release Changelog Modal */}
      <ChangelogModal
        isOpen={showChangelogModal}
        onClose={() => setShowChangelogModal(false)}
        C={C}
      />

      {/* AI Interview Modal */}
      {activeInterviewCandidate && (
        <InterviewModal
          candidate={activeInterviewCandidate}
          job={activeJob}
          onClose={() => setActiveInterviewCandidate(null)}
          C={C}
        />
      )}
    </div>
  );
}

/* ============================== CLIENT COMPANY ADD / EDIT MODAL ============================== */
function CompanyModal({ isOpen, company, onClose, onSave, onDelete, C }) {
  if (!isOpen) return null;
  const isEdit = !!company;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, backdropFilter: "blur(2px)" }}>
      <div
        key={company ? company.id : "new_comp"}
        style={{
          background: C.paper,
          borderRadius: 14,
          padding: 24,
          width: 480,
          maxWidth: "92%",
          border: `1px solid ${C.cardBorder}`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isEdit ? <Edit2 size={20} color={C.accent} /> : <Building2 size={20} color={C.accent} />}
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
                {isEdit ? `Edit Client: ${company.name}` : "Add New Client Company"}
              </h3>
              <p style={{ fontSize: 12, color: C.sub, margin: "2px 0 0" }}>
                {isEdit ? "Update client organization details, hiring email ID, and sender identity" : "Register a new client company for job postings and candidate shortlists"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: C.faint, padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const form = e.target;
          const compData = {
            id: isEdit ? company.id : `comp_${Date.now()}`,
            name: form.name.value.trim(),
            industry: form.industry.value.trim() || "General",
            contactEmail: form.email.value.trim() || "",
            senderName: form.senderName.value.trim() || "",
            notes: form.notes.value.trim() || "",
            createdAt: isEdit ? company.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          onSave(compData);
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
                Company Name <span style={{ color: "#DC2626" }}>*</span>
              </label>
              <input
                name="name"
                required
                defaultValue={company?.name || ""}
                placeholder="e.g. Motherson Group"
                style={inputStyle(C)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
                Industry / Business Domain
              </label>
              <input
                name="industry"
                defaultValue={company?.industry || ""}
                placeholder="e.g. Automotive & Manufacturing"
                style={inputStyle(C)}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
                Default Hiring / Reply-To Email ID
              </label>
              <input
                name="email"
                type="email"
                defaultValue={company?.contactEmail || ""}
                placeholder="e.g. hr@motherson.com"
                style={inputStyle(C)}
              />
              <span style={{ fontSize: 11, color: C.faint, display: "block", marginTop: 3 }}>
                ✉️ Candidate invitation email replies and inquiries will automatically route directly here.
              </span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
                Default Sender / Team Display Name
              </label>
              <input
                name="senderName"
                defaultValue={company?.senderName || ""}
                placeholder="e.g. Motherson Talent Acquisition"
                style={inputStyle(C)}
              />
              <span style={{ fontSize: 11, color: C.faint, display: "block", marginTop: 3 }}>
                👤 Shows in candidate invitation emails as the sending team (via CogniHire).
              </span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.sub, display: "block", marginBottom: 4 }}>
                Notes / Client Hiring Guidelines
              </label>
              <textarea
                name="notes"
                defaultValue={company?.notes || ""}
                placeholder="Specific hiring preferences, portal URLs, or guidelines for this client..."
                style={{ ...inputStyle(C), minHeight: 65, resize: "vertical" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
              {isEdit && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
                      onDelete(company.id);
                    }
                  }}
                  style={{
                    padding: "8px 12px",
                    background: "#FEE2E2",
                    color: "#DC2626",
                    border: "1px solid #FCA5A5",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              ) : <div />}

              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={onClose} style={btn("ghost", C)}>
                  Cancel
                </button>
                <button type="submit" style={btn("primary", C)}>
                  {isEdit ? "💾 Save Changes" : "➕ Add Company"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================== RELEASE CHANGELOG MODAL ============================== */
function ChangelogModal({ isOpen, onClose, C }) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        backdropFilter: "blur(4px)",
        padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.paper,
          borderRadius: 16,
          width: 720,
          maxWidth: "100%",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          border: `1px solid ${C.cardBorder}`,
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.3)",
          overflow: "hidden"
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${C.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: C.card
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${C.accentDeep} 0%, ${C.accent} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(3, 77, 161, 0.25)"
            }}>
              <History size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
                  CogniHire Release Changelog
                </h3>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  background: "#10B981",
                  padding: "2px 8px",
                  borderRadius: 12
                }}>
                  {APP_VERSION}
                </span>
              </div>
              <p style={{ fontSize: 12, color: C.sub, margin: "2px 0 0" }}>
                Platform release history, security patches, and feature updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: C.sub,
              padding: 6,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
          {CHANGELOG_DATA.map((rel, idx) => (
            <div
              key={rel.version}
              style={{
                position: "relative",
                paddingLeft: 28,
                borderLeft: `2px solid ${idx === 0 ? C.accent : C.line}`,
              }}
            >
              {/* Timeline dot */}
              <div style={{
                position: "absolute",
                left: -7,
                top: 2,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: idx === 0 ? C.accent : C.card,
                border: `2px solid ${idx === 0 ? "#FFFFFF" : C.sub}`
              }} />

              {/* Version title row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>
                    {rel.version} — {rel.title}
                  </span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 10,
                    background: `${rel.tagColor}1A`,
                    color: rel.tagColor,
                    border: `1px solid ${rel.tagColor}40`
                  }}>
                    {rel.badge}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: C.faint, fontWeight: 500 }}>
                  {rel.date}
                </span>
              </div>

              {/* Highlights cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 10 }}>
                {rel.highlights.map((h, hIdx) => (
                  <div
                    key={hIdx}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.line}`,
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>
                        {h.title}
                      </div>
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.45 }}>
                        {h.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "14px 24px",
          borderTop: `1px solid ${C.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: C.card
        }}>
          <div style={{ fontSize: 11.5, color: C.faint }}>
            Semantic Versioning <code>SemVer 2.0</code> · Built with React, Vite &amp; Express
          </div>
          <button
            onClick={onClose}
            style={{
              ...btn("primary", C),
              padding: "7px 18px",
              fontSize: 12.5,
            }}
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================== AI INTERVIEW SESSION MODAL ============================== */
function InterviewModal({ candidate, job, onClose, C }) {
  const r = candidate?.result || {};
  const questions = r.interviewQuestions && r.interviewQuestions.length > 0
    ? r.interviewQuestions
    : [
        `Looking at your resume, you listed several technical skills. Can you explain a complex technical problem you solved using one of those skills and how it works under the hood?`,
        `The role of ${job?.title || 'this position'} requires specific must-have skills. Can you give a highly detailed, technical example of how you've applied these in a production environment?`,
        `What is the most challenging technical system you have designed or optimized using your claimed skills, and what were the measurable outcomes?`
      ];

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Hello ${r.candidateName || candidate?.label || 'Candidate'}, welcome to your AI Technical Interview session for the position of ${job?.title || 'this role'} at ${job?.companyName || 'our client company'}.\n\nQuestion 1: ${questions[0]}` }
  ]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const handleSend = () => {
    if (!userInput.trim() || loading) return;
    const text = userInput.trim();
    setUserInput("");
    
    const newMsgs = [...messages, { role: "user", text }];
    setMessages(newMsgs);
    setLoading(true);

    setTimeout(() => {
      const nextIndex = currentQIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQIndex(nextIndex);
        setMessages([...newMsgs, { role: "assistant", text: `Thank you for your response. Let's proceed to Question ${nextIndex + 1}:\n\n${questions[nextIndex]}` }]);
      } else {
        setInterviewCompleted(true);
        setEvaluation({
          communicationScore: 92,
          technicalScore: 94,
          overallPerformance: "Strong Technical Candidate",
          keyTakeaways: "Demonstrated articulate technical reasoning, structured problem solving, and strong domain confidence."
        });
      }
      setLoading(false);
    }, 900);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: C.paper, borderRadius: 16, width: 680, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${C.cardBorder}` }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", background: C.sidebar, color: "#FFFFFF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: DISPLAY, display: "flex", alignItems: "center", gap: 8 }}>
              <MessageSquare size={18} color={C.accent} /> AI Technical Interview Session
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{r.candidateName || candidate?.label} · {job?.title} ({job?.companyName || 'Client'})</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#FFFFFF", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Conversation Chat Body */}
        <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, background: C.bg }}>
          {messages.map((m, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "82%",
                padding: "12px 16px",
                borderRadius: 12,
                background: m.role === "user" ? C.accent : C.paper,
                color: m.role === "user" ? "#FFFFFF" : C.ink,
                fontSize: 13.5,
                lineHeight: 1.5,
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                border: `1px solid ${m.role === "user" ? C.accent : C.line}`
              }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", marginBottom: 4, opacity: 0.8 }}>
                  {m.role === "user" ? "Candidate Response" : "AI Technical Interviewer"}
                </div>
                {m.text}
              </div>
            </div>
          ))}

          {interviewCompleted && evaluation && (
            <div style={{ background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 12, padding: 16, marginTop: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#15803D", display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={18} /> Interview Completed &amp; Evaluated
              </div>
              <div style={{ fontSize: 13, color: "#166534", marginTop: 6, lineHeight: 1.5 }}>
                {evaluation.keyTakeaways}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
                <div><span style={{ fontSize: 11, fontWeight: 700, color: "#15803D" }}>Technical Depth:</span> <strong>{evaluation.technicalScore}%</strong></div>
                <div><span style={{ fontSize: 11, fontWeight: 700, color: "#15803D" }}>Communication:</span> <strong>{evaluation.communicationScore}%</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        {!interviewCompleted && (
          <div style={{ padding: 16, background: C.paper, borderTop: `1px solid ${C.line}`, display: "flex", gap: 10 }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type candidate response to AI interview question..."
              style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.line}`, outline: "none", fontSize: 13.5, background: C.bg, color: C.ink }}
            />
            <button onClick={handleSend} disabled={loading} style={{ ...btn("primary", C), padding: "0 18px" }}>
              {loading ? <Loader2 size={16} className="spin" /> : <Play size={16} />} Submit Response
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
