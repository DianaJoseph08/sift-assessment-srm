import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Building2, Network, Users, UserCheck, UserPlus, Briefcase, Plus, Trash2,
  ArrowRight, CheckCircle2, Clock, Eye, Lock, LogIn, LogOut, Key, Shield,
  Sparkles, Filter, AlertCircle, RefreshCw, X, Check, Search, ExternalLink,
  ChevronRight, FileText, Award, TrendingUp, HelpCircle, Layers, CheckSquare,
  Compass, Send, Play, RotateCcw
} from 'lucide-react';

const DISPLAY = "'Outfit', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const BODY = "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const btnStyle = (type, C) => {
  const base = {
    padding: '8px 14px',
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: BODY,
    transition: 'all 0.15s ease',
  };
  if (type === 'primary') return { ...base, background: C.accent, color: '#FFFFFF' };
  if (type === 'soft') return { ...base, background: C.accentSoft, color: C.accent, border: `1px solid ${C.accent}` };
  if (type === 'ghost') return { ...base, background: 'transparent', color: C.ink, border: `1px solid ${C.line}` };
  if (type === 'danger') return { ...base, background: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' };
  if (type === 'success') return { ...base, background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' };
  return base;
};

const inputStyle = (C) => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: 7,
  border: `1px solid ${C.line}`,
  background: C.bg,
  color: C.ink,
  fontSize: 13.5,
  fontFamily: BODY,
  outline: 'none',
  boxSizing: 'border-box',
});

function Field({ label, hint, children, C }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: C.sub, marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, textTransform: 'none', marginLeft: 8, color: C.faint }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

/* =========================================================================
   1. LOGIN VIEW (Motherson Branded with 1-Click Role Logins & Super Admin Setup)
   ========================================================================= */
export function LoginView({ onLogin, C }) {
  const [mode, setMode] = useState('login'); // 'login' | 'setup'
  const [adminName, setAdminName] = useState('Praveen Ambrose');
  const [setupAvailable,setSetupAvailable]=useState(false);
  useEffect(()=>{fetch('/api/auth/setup-status').then(r=>r.json()).then(d=>setSetupAvailable(d.available));},[]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }
    setLoading(true);
    setError('');

    if (mode === 'setup') {
      try {
        const res = await fetch('/api/auth/setup-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: adminName.trim() || 'Motherson Super Admin',
            email: email.trim(),
            password: password.trim()
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to setup super admin account');
        }
        onLogin(data);
      } catch (err) {
        setError(err.message || 'Setup failed. Please check credentials.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: demoEmail, password: demoPassword })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Authentication failed');
        onLogin(data);
      })
      .catch(err => {
        setError(err.message || 'Demo login failed');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0B1120 0%, #0F172A 50%, #1E293B 100%)',
      padding: 24,
      fontFamily: BODY,
      color: '#F8FAFC'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: '#1E293B',
        borderRadius: 18,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden'
      }}>
        {/* Motherson Header */}
        <div style={{
          padding: '32px 36px 24px',
          background: 'linear-gradient(180deg, rgba(3, 77, 161, 0.25) 0%, rgba(30, 41, 59, 0) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', background: '#FFFFFF', borderRadius: 12, marginBottom: 16, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
            <img src="/motherson-logo-cropped.png" alt="Motherson" style={{ height: 26, width: 'auto' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#FFFFFF', fontFamily: DISPLAY, letterSpacing: -0.5 }}>
            CogniHire Talent OS
          </h1>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '8px 0 0' }}>
            {mode === 'setup'
              ? 'Configure / Register Your Email as Motherson Super Admin'
              : 'Enterprise Multi-Tenant AI Shortlisting & Technical Interview Platform'}
          </p>
        </div>

        {/* Form Body */}
        <div style={{ padding: '28px 36px' }}>
          {error && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 8,
              background: '#451A1A',
              border: '1px solid #7F1D1D',
              color: '#FCA5A5',
              fontSize: 13,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} flexShrink={0} />
                <span>{error}</span>
              </div>
              {mode === 'login' && setupAvailable && email.trim().toLowerCase()==='praveen.ambrose@motherson.com' && (
                <button
                  type="button"
                  onClick={() => { setMode('setup'); setEmail('Praveen.Ambrose@motherson.com'); setError(''); }}
                  style={{
                    alignSelf: 'flex-start',
                    marginTop: 4,
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Want to register &quot;{email}&quot; as Super Admin? Click here &rarr;
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'setup' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#38BDF8', marginBottom: 6 }}>
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="e.g. Your Name (or Motherson Admin)"
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: 8,
                    background: '#0F172A',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    fontSize: 14,
                    fontFamily: BODY,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94A3B8', marginBottom: 6 }}>
                {mode === 'setup' ? 'Your Super Admin Email Address' : 'Email Address or Username'}
              </label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'setup' ? "Praveen.Ambrose@motherson.com" : "admin@motherson.com (or admin)"}
                required
                autoFocus={mode === 'setup'}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 8,
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontFamily: BODY,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94A3B8', marginBottom: 6 }}>
                {mode === 'setup' ? 'Set Your Password' : 'Password'}
              </label>
              <input
                type="password"
                minLength={mode === 'setup' ? 8 : undefined}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 8,
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontFamily: BODY,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: '12px 18px',
                borderRadius: 8,
                background: mode === 'setup'
                  ? 'linear-gradient(135deg, #0284C7, #0369A1)'
                  : 'linear-gradient(135deg, #034DA1, #2563EB)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(3, 77, 161, 0.4)',
                fontFamily: BODY
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : mode === 'setup' ? <Shield size={16} /> : <LogIn size={16} />}
              <span>{loading ? 'Authenticating...' : mode === 'setup' ? '👑 Register & Sign In as Super Admin' : 'Sign In to Workspace'}</span>
            </button>

            {mode === 'setup' ? (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  fontSize: 13,
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: '4px 0',
                  textDecoration: 'underline'
                }}
              >
                &larr; Return to Standard Sign In
              </button>
            ) : setupAvailable ? (
              /* Designated Super Admin activation */
              <div style={{
                marginTop: 10,
                padding: '12px 14px',
                borderRadius: 10,
                background: 'rgba(3, 77, 161, 0.18)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Shield size={18} color="#38BDF8" flexShrink={0} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>First time as Super Admin?</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>Activate Praveen Ambrose on localhost</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setMode('setup'); setEmail('Praveen.Ambrose@motherson.com'); setError(''); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: '#034DA1',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255,255,255,0.2)',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Activate Praveen &rarr;
                </button>
              </div>
            ) : null}
          </form>

          {/* Quick Demo Sign In Shortcuts */}
          {mode === 'login' && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94A3B8', marginBottom: 10, textAlign: 'center' }}>
                Quick Demo Sign-In (1-Click)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@motherson.com', 'admin123')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 8,
                    background: '#0F172A',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    color: '#38BDF8',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to sign in instantly as Super Admin"
                >
                  👑 Admin<br />
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 400 }}>admin@motherson.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager.mech@bosch.com', 'manager123')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 8,
                    background: '#0F172A',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    color: '#34D399',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to sign in instantly as Manager"
                >
                  👔 Manager<br />
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 400 }}>manager.mech@bosch.com</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('recruiter.mech@bosch.com', 'recruiter123')}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 8,
                    background: '#0F172A',
                    border: '1px solid rgba(244, 114, 182, 0.35)',
                    color: '#F472B6',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Click to sign in instantly as Recruiter"
                >
                  🎯 Recruiter<br />
                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 400 }}>recruiter.mech@bosch.com</span>
                </button>
              </div>
            </div>
          )}

          <p style={{fontSize:12,color:'#94A3B8',marginTop:14,textAlign:'center'}}>Super Admin: Praveen Ambrose · Praveen.Ambrose@motherson.com</p>

        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. SUPER ADMIN DASHBOARD
   ========================================================================= */
export function AdminDashboard({
  onOpenCustomer,
  companies = [],
  clusters = [],
  users = [],
  jobs = [],
  currentUser,
  onCreateCompany,
  onCreateCluster,
  onCreateManager,
  onSelectJob,
  onNavigateTab,
  onOpenChangelog,
  C
}) {
  const managers = useMemo(() => (users || []).filter(u => u.role === 'manager'), [users]);
  const recruiters = useMemo(() => (users || []).filter(u => u.role === 'recruiter'), [users]);

  // Aggregate stats
  const totalJobs = (jobs || []).length;
  const totalCandidates = useMemo(() => (jobs || []).reduce((acc, j) => acc + (j.candidates ? j.candidates.length : 0), 0), [jobs]);
  const totalQualified = useMemo(() => {
    return (jobs || []).reduce((acc, j) => {
      const q = (j.candidates || []).filter(c => c.status === 'done' && c.result && c.result.overallScore >= 70);
      return acc + q.length;
    }, 0);
  }, [jobs]);

  // Chart data: Jobs per company
  const jobsByCompData = useMemo(() => {
    return (companies || []).map(comp => {
      const count = (jobs || []).filter(j => j.companyId === comp.id || (j.companyName && j.companyName.toLowerCase() === comp.name.toLowerCase())).length;
      return { name: comp.name.length > 12 ? comp.name.slice(0, 10) + '..' : comp.name, count };
    });
  }, [companies, jobs]);

  // Chart data: Clusters per company
  const clustersByCompData = useMemo(() => {
    return (companies || []).map(comp => {
      const count = (clusters || []).filter(cl => cl.customerId === comp.id).length;
      return { name: comp.name.length > 12 ? comp.name.slice(0, 10) + '..' : comp.name, count };
    });
  }, [companies, clusters]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${C.accentDeep} 0%, ${C.accent} 100%)`,
        borderRadius: 16,
        padding: '28px 32px',
        color: '#FFFFFF',
        boxShadow: '0 10px 25px -5px rgba(3, 77, 161, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              <Shield size={14} /> Motherson Super Admin Command Center
            </div>
            {onOpenChangelog && (
              <button
                onClick={onOpenChangelog}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: 'rgba(255,255,255,0.22)',
                  border: '1px solid rgba(255,255,255,0.45)',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={12} /> v1.4.0 Live
              </button>
            )}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', fontFamily: DISPLAY, lineHeight: 1.2 }}>
            Welcome, Super Admin | Motherson Platform
          </h1>
          <p style={{ fontSize: 14.5, opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            Enterprise multi-tenant orchestration: Add client companies, create flexible customer clusters, assign cluster managers, and oversee global screening pipelines.
          </p>
        </div>

        {/* Global Quick Add Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 190 }}>
          <button
            onClick={onCreateCompany}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#FFFFFF',
              color: C.accent,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Building2 size={16} /> Add Customer
          </button>
          <button
            onClick={() => onCreateCluster && onCreateCluster()}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <Network size={16} /> Add Cluster
          </button>
          <button
            onClick={() => onCreateManager && onCreateManager()}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.15)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <Users size={16} /> Add Manager
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Customers</span>
            <Building2 size={18} color="#0284C7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{companies.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>e.g. Bosch, Siemens, Motherson</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Custom Clusters</span>
            <Network size={18} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{clusters.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Dynamic, defined per customer</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Cluster Managers</span>
            <Users size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{managers.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Job creators & recruiter leads</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Recruiters</span>
            <UserCheck size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{recruiters.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Screeners & AI interviewers</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Active Jobs</span>
            <Briefcase size={18} color="#6366F1" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{totalJobs}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Across all clients & clusters</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18, boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Qualified Candidates</span>
            <Award size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', fontFamily: DISPLAY }}>{totalQualified}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Score &ge; 70% in screening</div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Chart 1: Jobs per Customer */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Briefcase size={16} color={C.accent} /> Jobs Distribution by Customer
          </div>
          <div style={{ height: 180, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobsByCompData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke={C.sub} fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke={C.sub} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(val) => [val, 'Jobs']}
                />
                <Bar dataKey="count" fill="#034DA1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Clusters per Customer */}
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Network size={16} color="#8B5CF6" /> Dynamic Clusters Configured by Customer
          </div>
          <div style={{ height: 180, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clustersByCompData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke={C.sub} fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} stroke={C.sub} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }}
                  formatter={(val) => [val, 'Clusters']}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Customer & Dynamic Cluster Directory */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={18} color={C.accent} /> Customer &amp; Cluster Architecture Directory
            </h3>
            <p style={{ fontSize: 12.5, color: C.sub, margin: '4px 0 0' }}>
              Every customer can have dynamic clusters (e.g., Mechanical, SAP, Embedded Systems) with dedicated managers.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onCreateCompany} style={btnStyle('primary', C)}>
              <Plus size={14} /> Add Customer
            </button>
            <button onClick={() => onCreateCluster && onCreateCluster()} style={btnStyle('soft', C)}>
              <Network size={14} /> Add Cluster
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(companies || []).map(comp => {
            const compClusters = (clusters || []).filter(cl => cl.customerId === comp.id);
            const compManagers = (users || []).filter(u => u.role === 'manager' && (u.customerId === comp.id || u.assignments?.some(a=>a.customerId===comp.id)));
            const compJobs = (jobs || []).filter(j => j.companyId === comp.id || (j.companyName && j.companyName.toLowerCase() === comp.name.toLowerCase()));

            return (
              <div key={comp.id} style={{
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                padding: '16px 20px',
                background: C.bg,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: C.paper, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={20} color={C.accent} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>
                        <button onClick={()=>onOpenCustomer?.(comp)} style={{background:"none",border:0,padding:0,color:C.ink,font:"inherit",fontWeight:800,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:4}}>{comp.name}</button>
                        {comp.industry && <span style={{ fontSize: 12, fontWeight: 500, color: C.sub, marginLeft: 8 }}>· {comp.industry}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>
                        {comp.location || 'Global'} · Contact: {comp.contactEmail || 'hr@company.com'} · {compJobs.length} Jobs
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      onClick={() => onCreateCluster && onCreateCluster(comp.id)}
                      style={{ ...btnStyle('ghost', C), fontSize: 12, padding: '6px 10px' }}
                      title="Add new cluster for this customer"
                    >
                      <Plus size={13} /> Add Cluster
                    </button>
                    <button
                      onClick={() => onCreateManager && onCreateManager(comp.id)}
                      style={{ ...btnStyle('ghost', C), fontSize: 12, padding: '6px 10px' }}
                      title="Add cluster manager for this customer"
                    >
                      <UserPlus size={13} /> Add Manager
                    </button>
                    <button
                      onClick={() => onNavigateTab && onNavigateTab('jobs')}
                      style={{ ...btnStyle('soft', C), fontSize: 12, padding: '6px 10px' }}
                    >
                      View Jobs ({compJobs.length}) &rarr;
                    </button>
                  </div>
                </div>

                {/* Clusters Row */}
                <div style={{ paddingTop: 8, borderTop: `1px dashed ${C.line}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: C.sub, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Network size={12} color="#8B5CF6" /> Configured Clusters ({compClusters.length}):
                  </div>
                  {compClusters.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.faint, fontStyle: 'italic' }}>
                      No clusters added yet. Click &quot;Add Cluster&quot; to create functional units (e.g. Mechanical, SAP, Electronics).
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {compClusters.map(cl => {
                        const clManagers = compManagers.filter(m => m.clusterId === cl.id || m.assignments?.some(a=>a.clusterId===cl.id));
                        return (
                          <div key={cl.id} style={{
                            padding: '6px 12px',
                            borderRadius: 8,
                            background: C.paper,
                            border: `1px solid ${C.line}`,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                          }}>
                            <span style={{ fontWeight: 700, color: C.ink }}>{cl.name}</span>
                            <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 4, background: C.accentSoft, color: C.accent, fontWeight: 700 }}>
                              {clManagers.length} {clManagers.length === 1 ? 'Manager' : 'Managers'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. CLUSTER MANAGER DASHBOARD
   ========================================================================= */
export function ManagerDashboard({
  companies = [],
  clusters = [],
  users = [],
  jobs = [],
  currentUser,
  onCreateJob,
  onCreateRecruiter,
  onUpdateJobStatus,
  onSelectJob,
  onNavigateTab,
  C
}) {
  const currentComp = useMemo(() => companies.find(c => c.id === currentUser?.customerId), [companies, currentUser]);
  const currentCluster = useMemo(() => clusters.find(cl => cl.id === currentUser?.clusterId), [clusters, currentUser]);

  // Jobs for this manager's cluster
  const clusterJobs = useMemo(() => {
    return (jobs || []).filter(j => true);
  }, [jobs, currentUser]);

  const clusterRecruiters = useMemo(() => {
    return (users || []).filter(u => u.role === 'recruiter' && (!currentUser?.clusterId || u.clusterId === currentUser.clusterId));
  }, [users, currentUser]);

  // Status breakdown
  const postedJobs = clusterJobs.filter(j => j.status === 'posted');
  const draftJobs = clusterJobs.filter(j => j.status === 'draft' || !j.status);
  const closedJobs = clusterJobs.filter(j => j.status === 'closed');

  const totalCandidates = clusterJobs.reduce((acc, j) => acc + (j.candidates ? j.candidates.length : 0), 0);
  const qualifiedCandidates = clusterJobs.reduce((acc, j) => {
    const q = (j.candidates || []).filter(c => c.status === 'done' && c.result && c.result.overallScore >= 70);
    return acc + q.length;
  }, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div style={{
        background: `linear-gradient(135deg, #0284C7 0%, #0369A1 100%)`,
        borderRadius: 16,
        padding: '28px 32px',
        color: '#FFFFFF',
        boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              <Building2 size={14} /> {currentComp ? currentComp.name : 'Client'} &bull; {currentCluster ? `${currentCluster.name} Cluster` : 'Cluster'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              <Users size={14} /> Manager Portal
            </div>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', fontFamily: DISPLAY, lineHeight: 1.2 }}>
            Cluster Management &amp; Requisition Desk
          </h1>
          <p style={{ fontSize: 14.5, opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            Upload and configure job descriptions, insert Client Hiring Manager names, post jobs to recruiters, and close or re-open requisitions.
          </p>
        </div>

        {/* Manager Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
          <button
            onClick={onCreateJob}
            style={{
              padding: '11px 18px',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#0369A1',
              fontWeight: 800,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Plus size={16} /> Post New Job
          </button>
          <button
            onClick={() => onCreateRecruiter && onCreateRecruiter()}
            style={{
              padding: '11px 18px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.2)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 13.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '1px solid rgba(255,255,255,0.35)'
            }}
          >
            <UserPlus size={16} /> Add Recruiter
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Cluster Openings</span>
            <Briefcase size={18} color={C.accent} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{clusterJobs.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Total created requisitions</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>Open to Recruiters</span>
            <CheckCircle2 size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', fontFamily: DISPLAY }}>{postedJobs.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Active for screening</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Draft Requisitions</span>
            <Clock size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706', fontFamily: DISPLAY }}>{draftJobs.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Pending posting</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Closed Positions</span>
            <Lock size={18} color="#64748B" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#64748B', fontFamily: DISPLAY }}>{closedJobs.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Hiring completed / closed</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Cluster Recruiters</span>
            <UserCheck size={18} color="#0284C7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{clusterRecruiters.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Assigned to this cluster</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>Candidates Screened</span>
            <Award size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', fontFamily: DISPLAY }}>{totalCandidates}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>{qualifiedCandidates} qualified (&ge;70%)</div>
        </div>
      </div>

      {/* Cluster Job Lifecycle Pipeline Table */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={18} color={C.accent} /> Job Lifecycle &amp; Recruiter Distribution Desk
            </h3>
            <p style={{ fontSize: 12.5, color: C.sub, margin: '4px 0 0' }}>
              Control requisition status: Click &quot;Post to Recruiters&quot; to publish, or &quot;Close Job&quot; when fulfilled.
            </p>
          </div>
          <button onClick={onCreateJob} style={btnStyle('primary', C)}>
            <Plus size={14} /> Create New Job Opening
          </button>
        </div>

        {clusterJobs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', border: `2px dashed ${C.line}`, borderRadius: 12 }}>
            <Briefcase size={36} color={C.faint} style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>No Job Openings in this Cluster Yet</h4>
            <p style={{ fontSize: 13, color: C.sub, margin: '0 0 16px' }}>Click &quot;Create New Job Opening&quot; to write a job description and designate a Client Hiring Manager.</p>
            <button onClick={onCreateJob} style={btnStyle('primary', C)}>+ Create Opening</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.line}`, textAlign: 'left', color: C.sub, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <th style={{ padding: '10px 14px' }}>Job Title</th>
                  <th style={{ padding: '10px 14px' }}>Client Hiring Manager</th>
                  <th style={{ padding: '10px 14px' }}>Experience &amp; Location</th>
                  <th style={{ padding: '10px 14px' }}>Candidates</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Manager Actions</th>
                </tr>
              </thead>
              <tbody>
                {clusterJobs.map(j => {
                  const cands = j.candidates || [];
                  const qCount = cands.filter(c => c.status === 'done' && c.result && c.result.overallScore >= 70).length;
                  const isPosted = j.status === 'posted';
                  const isClosed = j.status === 'closed';

                  return (
                    <tr key={j.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{j.title || 'Untitled Opening'}</div>
                        <div style={{ fontSize: 11.5, color: C.sub, marginTop: 2 }}>{j.seniority || 'Mid/Senior'}</div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 6, background: C.accentSoft, color: C.accent, fontWeight: 700, fontSize: 12 }}>
                          <UserCheck size={13} /> {j.clientManagerName ? j.clientManagerName : <span style={{ opacity: 0.6, fontStyle: 'italic' }}>Not specified</span>}
                        </div>
                      </td>
                      <td style={{ padding: '14px', color: C.sub, fontSize: 12.5 }}>
                        {j.minYears ? `${j.minYears}+ yrs` : '3+ yrs'} &bull; {j.location || 'Chennai / Hybrid'}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ fontWeight: 700, color: C.ink }}>{cands.length}</span>
                        {qCount > 0 && <span style={{ color: '#16A34A', fontSize: 11.5, marginLeft: 5 }}>({qCount} qual.)</span>}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          background: isPosted ? '#DCFCE7' : (isClosed ? '#F1F5F9' : '#FEF3C7'),
                          color: isPosted ? '#15803D' : (isClosed ? '#475569' : '#B45309'),
                          border: `1px solid ${isPosted ? '#86EFAC' : (isClosed ? '#CBD5E1' : '#FCD34D')}`
                        }}>
                          {isPosted ? '● Open to Recruiters' : (isClosed ? '● Closed' : '○ Draft')}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                          {/* Post or Close Controls */}
                          {!isPosted && (
                            <button
                              onClick={() => onUpdateJobStatus && onUpdateJobStatus(j.id, 'posted')}
                              style={{ ...btnStyle('success', C), fontSize: 12, padding: '5px 9px' }}
                              title="Post job to recruiters so they can screen candidates"
                            >
                              <Play size={12} /> Post to Recruiters
                            </button>
                          )}
                          {isPosted && (
                            <button
                              onClick={() => onUpdateJobStatus && onUpdateJobStatus(j.id, 'closed')}
                              style={{ ...btnStyle('ghost', C), fontSize: 12, padding: '5px 9px', color: '#64748B' }}
                              title="Close job opening"
                            >
                              <Lock size={12} /> Close Job
                            </button>
                          )}
                          {isClosed && (
                            <button
                              onClick={() => onUpdateJobStatus && onUpdateJobStatus(j.id, 'posted')}
                              style={{ ...btnStyle('soft', C), fontSize: 12, padding: '5px 9px' }}
                              title="Re-open job to recruiters"
                            >
                              <RotateCcw size={12} /> Re-open Job
                            </button>
                          )}
                          <button
                            onClick={() => onSelectJob && onSelectJob(j.id)}
                            style={{ ...btnStyle('ghost', C), fontSize: 12, padding: '5px 9px' }}
                            title="View candidate resume workspace"
                          >
                            Workspace &rarr;
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

      {/* Recruiter Roster in this Cluster */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY, display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserCheck size={18} color="#10B981" /> Cluster Recruiter Roster
            </h3>
            <p style={{ fontSize: 12.5, color: C.sub, margin: '4px 0 0' }}>
              Recruiters assigned to your cluster who can access open jobs and screen resumes.
            </p>
          </div>
          <button onClick={() => onCreateRecruiter && onCreateRecruiter()} style={btnStyle('soft', C)}>
            <UserPlus size={14} /> Add Recruiter
          </button>
        </div>

        {clusterRecruiters.length === 0 ? (
          <div style={{ fontSize: 13, color: C.faint, fontStyle: 'italic' }}>
            No recruiters assigned yet. Click &quot;Add Recruiter&quot; to onboard recruiters for this cluster.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {clusterRecruiters.map(rec => (
              <div key={rec.id} style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: C.bg,
                border: `1px solid ${C.line}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800 }}>
                  {rec.name.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{rec.name}</div>
                  <div style={{ fontSize: 11.5, color: C.sub }}>{rec.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   4. RECRUITER DASHBOARD
   ========================================================================= */
export function RecruiterDashboard({
  companies = [],
  clusters = [],
  users = [],
  jobs = [],
  currentUser,
  onSelectJob,
  onNavigateTab,
  C
}) {
  const currentComp = useMemo(() => companies.find(c => c.id === currentUser?.customerId), [companies, currentUser]);
  const currentCluster = useMemo(() => clusters.find(cl => cl.id === currentUser?.clusterId), [clusters, currentUser]);

  // Recruiter only works on posted jobs in their cluster
  const openJobs = useMemo(() => {
    return (jobs || []).filter(j => j.status === 'posted' && true);
  }, [jobs, currentUser]);

  const totalCandidatesScreened = useMemo(() => {
    return openJobs.reduce((acc, j) => acc + (j.candidates ? j.candidates.length : 0), 0);
  }, [openJobs]);

  const totalQualified = useMemo(() => {
    return openJobs.reduce((acc, j) => {
      const q = (j.candidates || []).filter(c => c.status === 'done' && c.result && c.result.overallScore >= 70);
      return acc + q.length;
    }, 0);
  }, [openJobs]);

  // Score distribution chart data
  const scoreDistData = useMemo(() => {
    let low = 0, mid = 0, high = 0;
    openJobs.forEach(j => {
      (j.candidates || []).forEach(c => {
        if (c.result && typeof c.result.overallScore === 'number') {
          if (c.result.overallScore < 50) low++;
          else if (c.result.overallScore < 75) mid++;
          else high++;
        }
      });
    });
    return [
      { name: '< 50% Review', count: low, fill: '#DC2626' },
      { name: '50-74% Moderate', count: mid, fill: '#D97706' },
      { name: '75%+ Qualified', count: high, fill: '#16A34A' },
    ];
  }, [openJobs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Banner */}
      <div style={{
        background: `linear-gradient(135deg, #059669 0%, #047857 100%)`,
        borderRadius: 16,
        padding: '28px 32px',
        color: '#FFFFFF',
        boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              <Building2 size={14} /> {currentComp ? currentComp.name : 'Client'} &bull; {currentCluster ? `${currentCluster.name} Cluster` : 'Cluster'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              <UserCheck size={14} /> Recruiter Workspace
            </div>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', fontFamily: DISPLAY, lineHeight: 1.2 }}>
            Recruiter Candidate Screening Desk
          </h1>
          <p style={{ fontSize: 14.5, opacity: 0.9, margin: 0, lineHeight: 1.5 }}>
            Pick an open job requisition posted by your Cluster Manager, upload applicant resumes, run AI deep scoring, and trigger interactive AI technical interviews.
          </p>
        </div>

        <div style={{ minWidth: 180 }}>
          <button
            onClick={() => onNavigateTab && onNavigateTab('jobs')}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              background: '#FFFFFF',
              color: '#047857',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Search size={16} /> Browse Open Jobs ({openJobs.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Open Jobs for You</span>
            <Briefcase size={18} color="#059669" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', fontFamily: DISPLAY }}>{openJobs.length}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Ready for resume upload</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, textTransform: 'uppercase' }}>Candidates Screened</span>
            <FileText size={18} color="#0284C7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>{totalCandidatesScreened}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Across open openings</div>
        </div>

        <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16A34A', textTransform: 'uppercase' }}>Highly Qualified</span>
            <Award size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16A34A', fontFamily: DISPLAY }}>{totalQualified}</div>
          <div style={{ fontSize: 11.5, color: C.faint, marginTop: 4 }}>Score &ge; 70% in evaluation</div>
        </div>
      </div>

      {/* Available Open Jobs Showcase */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={18} color="#059669" /> Open Job Requisitions
            </h3>
            <p style={{ fontSize: 12.5, color: C.sub, margin: '4px 0 0' }}>
              Select a position to upload candidate resumes, compare qualifications, or invite candidates to AI video interviews.
            </p>
          </div>
        </div>

        {openJobs.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', border: `2px dashed ${C.line}`, borderRadius: 12 }}>
            <Clock size={36} color={C.faint} style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '0 0 6px' }}>No Open Requisitions Currently Posted</h4>
            <p style={{ fontSize: 13, color: C.sub, margin: 0 }}>
              Your Cluster Manager has not published any openings yet. Once they click &quot;Post to Recruiters&quot;, jobs will appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {openJobs.map(j => {
              const cands = j.candidates || [];
              const qCount = cands.filter(c => c.status === 'done' && c.result && c.result.overallScore >= 70).length;

              return (
                <div key={j.id} style={{
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: 18,
                  background: C.bg,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, fontFamily: DISPLAY }}>
                        {j.title || 'Untitled Opening'}
                      </div>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 7px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', textTransform: 'uppercase' }}>
                        Open
                      </span>
                    </div>

                    {/* Client Hiring Manager Badge */}
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, background: C.paper, border: `1px solid ${C.line}`, fontSize: 12, color: C.ink }}>
                      <UserCheck size={13} color={C.accent} />
                      <span style={{ color: C.sub }}>Hiring Manager:</span>
                      <strong>{j.clientManagerName || 'Client Talent Lead'}</strong>
                    </div>

                    <div style={{ fontSize: 12.5, color: C.sub, marginTop: 8 }}>
                      {j.seniority || 'Senior'} &bull; {j.minYears || 3}+ yrs exp &bull; {j.location || 'Chennai / Hybrid'}
                    </div>

                    {/* Skills pills */}
                    {Array.isArray(j.mustHave) && j.mustHave.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                        {j.mustHave.slice(0, 3).map((skill, idx) => (
                          <span key={idx} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, background: C.paper, color: C.sub, border: `1px solid ${C.line}` }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 12, color: C.sub }}>
                      <strong>{cands.length}</strong> candidates {qCount > 0 && <span style={{ color: '#16A34A' }}>({qCount} qual.)</span>}
                    </div>

                    <button
                      onClick={() => onSelectJob && onSelectJob(j.id)}
                      style={{ ...btnStyle('primary', C), fontSize: 12.5, padding: '6px 12px' }}
                    >
                      Screen Candidates &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Candidate Score Distribution Chart */}
      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={16} color="#10B981" /> Candidate Screening Quality Breakdown
        </div>
        <div style={{ height: 160, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke={C.sub} fontSize={11} tickLine={false} />
              <YAxis allowDecimals={false} stroke={C.sub} fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }}
                formatter={(val) => [val, 'Candidates']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {scoreDistData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. WELCOME DASHBOARD ROUTER (Delegates to Role Dashboard)
   ========================================================================= */
export function WelcomeDashboard(props) {
  const role = props.currentUser?.role;

  if (role === 'manager') {
    return <ManagerDashboard {...props} />;
  }
  if (role === 'recruiter') {
    return <RecruiterDashboard {...props} />;
  }
  // Default to Super Admin
  return <AdminDashboard {...props} />;
}

/* =========================================================================
   6. CLUSTERS VIEW (Super Admin Cluster Management Tab)
   ========================================================================= */
export function ClustersView({
  companies = [],
  clusters = [],
  users = [],
  jobs = [],
  onCreateCluster,
  onDeleteCluster,
  onCreateManager,
  C
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
            Customer Functional Clusters
          </h2>
          <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>
            Define custom clusters (e.g. Mechanical, SAP, Embedded Systems) for each client company.
          </p>
        </div>
        <button onClick={() => onCreateCluster && onCreateCluster()} style={btnStyle('primary', C)}>
          <Plus size={14} /> Add Cluster
        </button>
      </div>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}`, textAlign: 'left', color: C.sub, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, background: C.bg }}>
              <th style={{ padding: '12px 16px' }}>Cluster Name</th>
              <th style={{ padding: '12px 16px' }}>Customer / Client</th>
              <th style={{ padding: '12px 16px' }}>Description</th>
              <th style={{ padding: '12px 16px' }}>Managers</th>
              <th style={{ padding: '12px 16px' }}>Jobs</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clusters.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 36, textAlign: 'center', color: C.sub }}>
                  No clusters created yet. Click &quot;Add Cluster&quot; to define your first cluster.
                </td>
              </tr>
            ) : (
              clusters.map(cl => {
                const comp = companies.find(c => c.id === cl.customerId);
                const clManagers = users.filter(u => u.role === 'manager' && (u.clusterId === cl.id || u.assignments?.some(a=>a.clusterId===cl.id)));
                const clJobs = jobs.filter(j => j.clusterId === cl.id);

                return (
                  <tr key={cl.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#8B5CF6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Network size={15} />
                        </div>
                        <span style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{cl.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: C.ink }}>
                      {comp ? comp.name : cl.customerId}
                    </td>
                    <td style={{ padding: '14px 16px', color: C.sub, maxWidth: 280 }}>
                      {cl.description || 'Functional business cluster'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: C.accentSoft, color: C.accent, fontWeight: 700, fontSize: 11.5 }}>
                        {clManagers.length} {clManagers.length === 1 ? 'Manager' : 'Managers'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: C.ink, fontWeight: 700 }}>
                      {clJobs.length}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={() => onCreateManager && onCreateManager(cl.customerId, cl.id)}
                          style={{ ...btnStyle('ghost', C), fontSize: 12, padding: '4px 8px' }}
                          title="Add Manager to this cluster"
                        >
                          <UserPlus size={13} />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete cluster "${cl.name}"? This action cannot be undone.`)) {
                              onDeleteCluster && onDeleteCluster(cl.id);
                            }
                          }}
                          style={{ ...btnStyle('danger', C), fontSize: 12, padding: '4px 8px' }}
                          title="Delete Cluster"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================================
   7. MANAGERS VIEW (Super Admin Manager Management Tab)
   ========================================================================= */
export function ManagersView({
  companies = [],
  clusters = [],
  users = [],
  onCreateManager,
  onDeleteUser,
  C
}) {
  const managers = useMemo(() => (users || []).filter(u => u.role === 'manager'), [users]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
            Cluster Managers Directory
          </h2>
          <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>
            Managers have authority over specific client clusters: posting jobs, assigning recruiters, and closing positions.
          </p>
        </div>
        <button onClick={() => onCreateManager && onCreateManager()} style={btnStyle('primary', C)}>
          <UserPlus size={14} /> Add Manager
        </button>
      </div>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}`, textAlign: 'left', color: C.sub, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, background: C.bg }}>
              <th style={{ padding: '12px 16px' }}>Manager Name</th>
              <th style={{ padding: '12px 16px' }}>Email</th>
              <th style={{ padding: '12px 16px' }}>Assigned Customer</th>
              <th style={{ padding: '12px 16px' }}>Assigned Cluster</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {managers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: C.sub }}>
                  No managers registered yet. Click &quot;Add Manager&quot; to onboard your first cluster manager.
                </td>
              </tr>
            ) : (
              managers.map(mgr => {
                const comp = companies.find(c => c.id === mgr.customerId);
                const cluster = clusters.find(cl => cl.id === mgr.clusterId);

                return (
                  <tr key={mgr.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0284C7', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {mgr.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{mgr.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: C.sub }}>{mgr.email}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: C.ink }}>
                      {mgr.assignments?.length ? [...new Set(mgr.assignments.map(a=>companies.find(c=>c.id===a.customerId)?.name||a.customerId))].join(', ') : (comp?.name || mgr.customerId)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: '#F3E8FF', color: '#7E22CE', fontWeight: 700, fontSize: 11.5 }}>
                        {mgr.assignments?.length ? mgr.assignments.map(a=>clusters.find(c=>c.id===a.clusterId)?.name||a.clusterId).join(', ') : (cluster?.name || 'No cluster assigned')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete manager "${mgr.name}"?`)) {
                            onDeleteUser && onDeleteUser(mgr.id);
                          }
                        }}
                        style={{ ...btnStyle('danger', C), fontSize: 12, padding: '4px 8px' }}
                        title="Delete Manager"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================================
   8. RECRUITERS VIEW (Manager & Admin Recruiter Management Tab)
   ========================================================================= */
export function RecruitersView({
  companies = [],
  clusters = [],
  users = [],
  currentUser,
  onCreateRecruiter,
  onDeleteUser,
  C
}) {
  const recruiters = useMemo(() => {
    return (users || []).filter(u => u.role === 'recruiter' && (!currentUser?.clusterId || u.clusterId === currentUser.clusterId));
  }, [users, currentUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: C.ink, fontFamily: DISPLAY }}>
            Recruiter Workforce
          </h2>
          <p style={{ fontSize: 13, color: C.sub, margin: '4px 0 0' }}>
            Recruiters access open positions posted to their cluster, upload resumes, and conduct AI candidate evaluations.
          </p>
        </div>
        <button onClick={() => onCreateRecruiter && onCreateRecruiter()} style={btnStyle('primary', C)}>
          <UserPlus size={14} /> Add Recruiter
        </button>
      </div>

      <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}`, textAlign: 'left', color: C.sub, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: 0.5, background: C.bg }}>
              <th style={{ padding: '12px 16px' }}>Recruiter Name</th>
              <th style={{ padding: '12px 16px' }}>Email</th>
              <th style={{ padding: '12px 16px' }}>Assigned Customer</th>
              <th style={{ padding: '12px 16px' }}>Assigned Cluster</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recruiters.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 36, textAlign: 'center', color: C.sub }}>
                  No recruiters added yet. Click &quot;Add Recruiter&quot; to invite a recruiter to this cluster.
                </td>
              </tr>
            ) : (
              recruiters.map(rec => {
                const comp = companies.find(c => c.id === rec.customerId);
                const cluster = clusters.find(cl => cl.id === rec.clusterId);

                return (
                  <tr key={rec.id} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: '#10B981', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                          {rec.name.slice(0, 1).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{rec.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: C.sub }}>{rec.email}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: C.ink }}>
                      {comp ? comp.name : rec.customerId}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: 11.5 }}>
                        {cluster ? cluster.name : (rec.clusterId || 'All')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete recruiter "${rec.name}"?`)) {
                            onDeleteUser && onDeleteUser(rec.id);
                          }
                        }}
                        style={{ ...btnStyle('danger', C), fontSize: 12, padding: '4px 8px' }}
                        title="Delete Recruiter"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =========================================================================
   9. CLUSTER MODAL
   ========================================================================= */
export function ClusterModal({
  isOpen,
  targetCompanyId,
  companies = [],
  onClose,
  onSave,
  C
}) {
  const [customerId, setCustomerId] = useState(targetCompanyId || (companies[0] ? companies[0].id : ''));
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Synchronize customerId if targetCompanyId changes
  React.useEffect(() => {
    if (targetCompanyId) setCustomerId(targetCompanyId);
    else if (companies[0] && !customerId) setCustomerId(companies[0].id);
  }, [targetCompanyId, companies]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a cluster name.');
      return;
    }
    if (!customerId) {
      setError('Please select a customer company.');
      return;
    }
    onSave({
      customerId,
      name: name.trim(),
      description: description.trim()
    });
    setName('');
    setDescription('');
    setError('');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: C.paper, borderRadius: 16, width: 480, maxWidth: '100%', overflow: 'hidden', border: `1px solid ${C.cardBorder}`, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 24px', background: C.sidebar, color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, fontFamily: DISPLAY, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Network size={20} color="#8B5CF6" /> Add New Customer Cluster
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, fontSize: 12.5 }}>
              {error}
            </div>
          )}

          <Field label="Target Customer Company" hint="Which customer this cluster belongs to" C={C}>
            <select
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              style={inputStyle(C)}
              required
            >
              {companies.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Cluster Name" hint="e.g. Mechanical, SAP, Embedded Systems" C={C}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Mechanical"
              style={inputStyle(C)}
              required
              autoFocus
            />
          </Field>

          <Field label="Cluster Description" hint="Scope of technology or engineering unit" C={C}>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Powertrain, CAD/CAM, structural simulation & tooling division"
              rows={3}
              style={{ ...inputStyle(C), resize: 'vertical' }}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={btnStyle('ghost', C)}>
              Cancel
            </button>
            <button type="submit" style={btnStyle('primary', C)}>
              <Check size={14} /> Create Cluster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
   10. USER MODAL (Create Manager or Recruiter)
   ========================================================================= */
export function UserModal({
  isOpen,
  role = 'manager',
  targetCustomerId,
  targetClusterId,
  companies = [],
  clusters = [],
  users = [],
  currentUser,
  onClose,
  onSave,
  C
}) {
  const isManagerMode = currentUser?.role === 'manager';

  const defaultCompId = isManagerMode
    ? currentUser.customerId
    : (targetCustomerId || (companies[0] ? companies[0].id : ''));

  const [selectedCustomerId, setSelectedCustomerId] = useState(defaultCompId);
  const [selectedClusterId, setSelectedClusterId] = useState(targetClusterId || (isManagerMode ? currentUser.clusterId : ''));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving,setSaving]=useState(false);
  const [existingUserId,setExistingUserId]=useState('');
  const existingManagers=users.filter(u=>u.role==='manager');

  // Dynamically filter clusters for the selected company
  const availableClusters = useMemo(() => {
    return clusters.filter(cl => cl.customerId === selectedCustomerId);
  }, [clusters, selectedCustomerId]);

  React.useEffect(() => {
    if(!isOpen)return;
    setError('');setExistingUserId('');
    if (isManagerMode) {
      setSelectedCustomerId(currentUser.customerId);
      setSelectedClusterId(currentUser.clusterId);
    } else {
      setSelectedCustomerId(targetCustomerId || companies[0]?.id || '');
      setSelectedClusterId(targetClusterId || '');
    }
  }, [isOpen, targetCustomerId, targetClusterId, currentUser, isManagerMode]);

  // Set default cluster if current cluster is not in availableClusters
  React.useEffect(() => {
    if (!isManagerMode) {
      if (!availableClusters.some(cl => cl.id === selectedClusterId)) {
        setSelectedClusterId(availableClusters[0]?.id || '');
      }
    }
  }, [availableClusters, selectedClusterId, isManagerMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!existingUserId && (!name.trim() || !email.trim() || !password.trim())) {
      setError('Please fill all required fields.');
      return;
    }
    if (!selectedCustomerId) {
      setError('Please select a customer company.');
      return;
    }
    if(!existingUserId && password.length<8){setError('Password must contain at least 8 characters.');return;}
    if(!availableClusters.some(cl=>cl.id===selectedClusterId)){setError('Please select a cluster for this customer.');return;}
    if(saving)return;
    setSaving(true);setError('');
    try {
    await onSave({
      existingUserId:existingUserId||undefined,
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      customerId: selectedCustomerId,
      clusterId: selectedClusterId || null
    });
    setName('');
    setEmail('');
    setPassword('');
    setError('');
    }catch(e){setError(e.message||'Unable to create account. Please retry.');}
    finally{setSaving(false);}
  };

  const title = role === 'manager' ? 'Add Cluster Manager' : 'Add Recruiter';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: C.paper, borderRadius: 16, width: 480, maxWidth: '100%', overflow: 'hidden', border: `1px solid ${C.cardBorder}`, boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '20px 24px', background: C.sidebar, color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, fontFamily: DISPLAY, display: 'flex', alignItems: 'center', gap: 8 }}>
            {role === 'manager' ? <Users size={20} color="#0284C7" /> : <UserCheck size={20} color="#10B981" />}
            {title}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ padding: '8px 12px', background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, fontSize: 12.5 }}>
              {error}
            </div>
          )}

          {role==='manager' && <Field label="Manager account" hint="Assign an existing manager to an additional cluster, or create a new account" C={C}><select value={existingUserId} onChange={e=>{setExistingUserId(e.target.value);setError('');}} style={inputStyle(C)} disabled={saving}><option value="">Create new manager</option>{existingManagers.map(u=><option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}</select></Field>}
          {!existingUserId && <>
          <p style={{fontSize:12,color:C.sub,margin:0}}>A welcome email with the username, initial password and login link is sent automatically when Admin email delivery is configured.</p>
          <Field label="Full Name" hint="Official person name" C={C}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              style={inputStyle(C)}
              required
              autoFocus
            />
          </Field>

          <Field label="Email Address" hint="Used for workspace login" C={C}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. rajesh@bosch.com"
              style={inputStyle(C)}
              required
            />
          </Field>

          <Field label="Password" hint="Minimum 8 characters" C={C}>
            <input
              type="password"
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle(C)}
              required
            />
          </Field>

          </>}
          {existingUserId && <p style={{fontSize:12,color:C.sub,margin:0}}>This adds cluster access to the same account. The existing password stays unchanged.</p>}
          {/* Customer select (locked if manager) */}
          <Field label="Customer Company" hint={isManagerMode ? 'Locked to your customer' : 'Select client'} C={C}>
            <select
              value={selectedCustomerId}
              onChange={e => setSelectedCustomerId(e.target.value)}
              disabled={isManagerMode}
              style={{ ...inputStyle(C), opacity: isManagerMode ? 0.7 : 1 }}
              required
            >
              {companies.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
          </Field>

          {/* Cluster select (locked if manager) */}
          <Field label="Functional Cluster" hint={isManagerMode ? 'Locked to your cluster' : 'Filtered by customer'} C={C}>
            <select
              value={selectedClusterId}
              onChange={e => setSelectedClusterId(e.target.value)}
              disabled={isManagerMode}
              style={{ ...inputStyle(C), opacity: isManagerMode ? 0.7 : 1 }}
            >
              <option value="">-- No specific cluster --</option>
              {availableClusters.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.name}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={btnStyle('ghost', C)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={btnStyle('primary', C)}>
              <Check size={14} /> {saving?'Saving…':existingUserId?'Assign manager to cluster':`Create ${role === 'manager' ? 'Manager' : 'Recruiter'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


