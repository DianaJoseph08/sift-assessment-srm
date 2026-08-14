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

function uid() {
  return "id_" + Math.random().toString(36).substr(2, 9);
}

/* Helper button styles */
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

/* ============================== SIDEBAR NAVIGATION ============================== */
function Sidebar({ activeTab, setActiveTab, currentTheme, setTheme, companies, activeCompany, setActiveCompany, C }) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "companies", label: "Client Companies", icon: Building2, badge: companies.length },
    { id: "jobs", label: "Job Openings & Screening", icon: Briefcase },
    { id: "logs", label: "Activity & Audit Logs", icon: Activity },
    { id: "settings", label: "Settings & AI Keys", icon: Settings },
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
        <SrmLogo theme="dark" />
        <div style={{ marginTop: 10, fontSize: 11, color: "#64748B", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Agency Shortlist Engine
        </div>
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
    </aside>
  );
}

/* ============================== WELCOME & AGENCY DASHBOARD ============================== */
function WelcomeDashboard({ companies, jobs, activeCompany, setActiveCompany, onCreateCompany, onCreateJob, onSelectJob, C }) {
  const filteredJobs = useMemo(() => {
    if (!activeCompany) return jobs;
    return jobs.filter(j => j.companyId === activeCompany.id);
  }, [jobs, activeCompany]);

  const totalCandidates = useMemo(() => {
    return filteredJobs.reduce((acc, j) => acc + (j.candidates ? j.candidates.length : 0), 0);
  }, [filteredJobs]);

  const totalShortlisted = useMemo(() => {
    return filteredJobs.reduce((acc, j) => {
      const shortlisted = (j.candidates || []).filter(c => c.status === "done" && c.result && c.result.overallScore >= 70);
      return acc + shortlisted.length;
    }, 0);
  }, [filteredJobs]);

  const recentShortlist = useMemo(() => {
    const list = [];
    filteredJobs.forEach(j => {
      (j.candidates || []).forEach(c => {
        if (c.status === "done" && c.result) {
          list.push({ candidate: c, job: j });
        }
      });
    });
    return list.sort((a, b) => (b.candidate.result.overallScore || 0) - (a.candidate.result.overallScore || 0)).slice(0, 5);
  }, [filteredJobs]);

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
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.15)", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            <Sparkles size={14} /> Agency AI Shortlisting Hub
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, fontFamily: DISPLAY, lineHeight: 1.2 }}>
            Candidate Screening &amp; Client Recommendation Portal
          </h2>
          <p style={{ fontSize: 14, margin: "10px 0 0", opacity: 0.9, lineHeight: 1.5 }}>
            Screen candidate resumes against client company requirements, score fit, conduct AI interviews, and export formal recommendation reports back to client companies.
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

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <Panel C={C}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={22} color={C.accent} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Client Companies</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{companies.length}</div>
            </div>
          </div>
        </Panel>

        <Panel C={C}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Briefcase size={22} color={C.accent} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Active Opening Jobs</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{filteredJobs.length}</div>
            </div>
          </div>
        </Panel>

        <Panel C={C}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={22} color={C.accent} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Total Resumes Screened</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{totalCandidates}</div>
            </div>
          </div>
        </Panel>

        <Panel C={C}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={22} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Shortlisted Candidates</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#16A34A", fontFamily: DISPLAY }}>{totalShortlisted}</div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Main Dashboard Section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <Panel title={activeCompany ? `Job Openings for ${activeCompany.name}` : "Client Company Job Openings"} sub="Manage jobs and upload candidate resumes for evaluation" C={C}>
          {filteredJobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: C.faint }}>
              <Briefcase size={36} style={{ opacity: 0.5, marginBottom: 10 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No job openings found</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>Click "Post Opening Job" to create a new role for screening</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filteredJobs.map((j) => {
                const screened = (j.candidates || []).filter(c => c.status === "done").length;
                const shortlisted = (j.candidates || []).filter(c => c.status === "done" && c.result && c.result.overallScore >= 70).length;
                return (
                  <div key={j.id} style={{
                    padding: 16,
                    borderRadius: 10,
                    border: `1px solid ${C.line}`,
                    background: C.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, background: C.accentSoft, color: C.accent, padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                          🏢 {j.companyName}
                        </span>
                        <span style={{ fontSize: 11, color: C.sub }}>{j.seniority} • {j.minYears}+ yrs exp</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginTop: 4, fontFamily: DISPLAY }}>
                        {j.title}
                      </div>
                      <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
                        Must-have: {(j.mustHave || []).slice(0, 3).join(", ") || "None specified"}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{shortlisted} / {screened}</div>
                        <div style={{ fontSize: 11, color: C.sub }}>Shortlisted</div>
                      </div>
                      <button
                        onClick={() => onSelectJob(j.id)}
                        style={{
                          padding: "8px 14px",
                          background: C.accent,
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 12.5,
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: BODY,
                        }}
                      >
                        Screen Resumes <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="Top Client Recommendations" sub="Highest scoring candidates ready to recommend to client companies" C={C}>
          {recentShortlist.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: C.faint, fontSize: 13 }}>
              No scored candidates yet. Run screening to see top recommendations.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentShortlist.map(({ candidate, job }) => (
                <div key={candidate.id} style={{ padding: 12, borderRadius: 8, border: `1px solid ${C.line}`, background: C.bg }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{candidate.result.candidateName || candidate.label}</div>
                      <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>🏢 {job.companyName} — {job.title}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: gradeColor(candidate.result.overallScore) }}>
                      {candidate.result.overallScore}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ============================== CLIENT COMPANIES MANAGEMENT ============================== */
function CompanyManager({ companies, jobs, onCreateCompany, onDeleteCompany, onSelectCompanyJobs, C }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.industry.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [companies, searchTerm]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>Client Companies Management</h2>
          <p style={{ fontSize: 13, color: C.sub, margin: "4px 0 0" }}>Manage client organizations that send job openings and receive candidate recommendations</p>
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
          const compJobs = jobs.filter(j => j.companyId === comp.id);
          const totalScreened = compJobs.reduce((acc, j) => acc + (j.candidates ? j.candidates.length : 0), 0);
          return (
            <Panel key={comp.id} C={C} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Building2 size={20} color={C.accent} />
                  </div>
                  <Trash2 size={16} color={C.faint} style={{ cursor: "pointer" }} onClick={() => onDeleteCompany(comp.id)} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: "12px 0 4px", fontFamily: DISPLAY }}>{comp.name}</h3>
                <div style={{ fontSize: 12, color: C.sub }}>Industry: {comp.industry}</div>
                {comp.contactEmail && <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>✉ {comp.contactEmail}</div>}
                {comp.notes && <p style={{ fontSize: 12, color: C.sub, marginTop: 8, lineHeight: 1.4 }}>{comp.notes}</p>}
              </div>

              <div style={{ marginTop: 20, paddingTop: 14, borderTop: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{compJobs.length} Openings</div>
                  <div style={{ fontSize: 11, color: C.sub }}>{totalScreened} Candidates</div>
                </div>
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

/* ============================== SETTINGS & API KEYS VIEW ============================== */
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [llmProvider, setLlmProvider] = useState("groq");
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
      title: "Senior Software Engineer",
      seniority: "Senior",
      minYears: 3,
      location: "Bangalore / Remote",
      description: "Looking for an experienced engineer to build high-performance distributed systems.",
      mustHave: ["React", "Node.js", "System Design"],
      niceToHave: ["AWS", "Docker"],
      candidates: [],
      screening: "idle"
    };
    setJobs(prev => [newJob, ...prev]);
    setActiveJobId(newId);
    setActiveTab("jobs");
  };

  const activeJob = useMemo(() => jobs.find((j) => j.id === activeJobId), [jobs, activeJobId]);

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
                onSelectJob={(jId) => { setActiveJobId(jId); setActiveTab("jobs"); }}
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
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, overflowX: "auto" }}>
                      {jobs.map(j => (
                        <button
                          key={j.id}
                          onClick={() => setActiveJobId(j.id)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 8,
                            border: `1px solid ${activeJobId === j.id ? C.accent : C.line}`,
                            background: activeJobId === j.id ? C.accentSoft : C.paper,
                            color: activeJobId === j.id ? C.accent : C.ink,
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: "pointer",
                            fontFamily: BODY,
                          }}
                        >
                          🏢 {j.companyName} — {j.title}
                        </button>
                      ))}
                    </div>

                    {activeJob && (
                      <Panel C={C}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.ink, fontFamily: DISPLAY }}>
                          {activeJob.title} <span style={{ fontSize: 13, color: C.sub, fontWeight: 400 }}>(Client: {activeJob.companyName})</span>
                        </div>
                        <div style={{ fontSize: 13, color: C.sub, marginTop: 4 }}>
                          {activeJob.seniority} • {activeJob.minYears}+ Yrs Exp • {activeJob.location}
                        </div>
                        <p style={{ fontSize: 13, color: C.ink, marginTop: 10, lineHeight: 1.5 }}>
                          {activeJob.description}
                        </p>
                      </Panel>
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
