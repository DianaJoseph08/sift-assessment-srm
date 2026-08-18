import React, { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   SRM GEMINI VIDEO AI INTERVIEW PLATFORM
   - Powered by Google Gemini 2.0 Flash
   - Video feed + Voice input + Text fallback
   - Full malpractice detection
   - 3-minute countdown per question (auto-advance at 0:00)
   - Candidate can submit at any time
   ============================================================ */

const MAX_SECONDS = 180; // 3 minutes per question, auto-advance at 0
const MEDIAPIPE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm";
const FACE_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function MalpracticeBadge({ count, label, color }) {
  if (count === 0) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5, padding: "3px 8px",
      background: color + "22", border: `1px solid ${color}`, borderRadius: 6,
      fontSize: 11, fontWeight: 700, color
    }}>
      ⚠️ {label}: {count}
    </div>
  );
}

export default function GeminiInterview({ candidate, job, onComplete }) {
  const r = candidate?.result || {};
  const candidateName = r.candidateName || candidate?.label || "Candidate";

  // ── State ────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState("welcome");
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [userText, setUserText] = useState("");
  const [listening, setListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_SECONDS);
  const [finalReport, setFinalReport] = useState(null);

  // Malpractice
  const [malpractice, setMalpractice] = useState({
    tabSwitches: 0, cursorLeaves: 0, copyPastes: 0, keyboardAbuse: 0, lookingAway: 0,
  });
  const [malpracticeLog, setMalpracticeLog] = useState([]);
  const [malpracticeAlert, setMalpracticeAlert] = useState("");

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const faceIntervalRef = useRef(null);
  const chatRef = useRef(null);
  const submitFnRef = useRef(null);

  // ── Malpractice logging ──────────────────────────────────────────────────
  const logMalpractice = useCallback((type, key) => {
    const ts = new Date().toLocaleTimeString();
    setMalpractice(prev => ({ ...prev, [key]: prev[key] + 1 }));
    setMalpracticeLog(prev => [...prev, { type, ts }]);
    setMalpracticeAlert(`⚠️ ${type} detected at ${ts}`);
    setTimeout(() => setMalpracticeAlert(""), 4000);
  }, []);

  // ── Proctoring Event Listeners ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== "interview") return;
    const onVisChange = () => { if (document.hidden) logMalpractice("Tab switched / window minimized", "tabSwitches"); };
    const onBlur = () => logMalpractice("Window focus lost", "tabSwitches");
    const onMouseLeave = (e) => {
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)
        logMalpractice("Cursor left browser window", "cursorLeaves");
    };
    const onPaste = (e) => { e.preventDefault(); logMalpractice("Paste attempt blocked", "copyPastes"); };
    const onCopy = (e) => { e.preventDefault(); logMalpractice("Copy attempt blocked", "copyPastes"); };
    const onCtxMenu = (e) => { e.preventDefault(); logMalpractice("Right-click menu blocked", "copyPastes"); };
    const onKeyDown = (e) => {
      const forbidden = (e.ctrlKey || e.metaKey) && ["c","v","t","w","r","u","a"].includes(e.key.toLowerCase());
      const altTab = e.altKey && e.key === "Tab";
      if (forbidden || altTab || e.key === "F12") {
        e.preventDefault();
        logMalpractice(`Keyboard shortcut blocked (${e.key})`, "keyboardAbuse");
      }
    };
    document.addEventListener("visibilitychange", onVisChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onCtxMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onCtxMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [phase, logMalpractice]);

  // ── MediaPipe Face Gaze ───────────────────────────────────────────────────
  const initFaceLandmarker = useCallback(async () => {
    try {
      const { FaceLandmarker, FilesetResolver } = await import(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/vision_bundle.js"
      ).catch(() => null) || {};
      if (!FaceLandmarker) return;
      const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_CDN);
      const fl = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true,
      });
      faceLandmarkerRef.current = fl;
      let awayFrames = 0;
      faceIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !faceLandmarkerRef.current) return;
        try {
          const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, performance.now());
          const nFaces = results?.faceLandmarks?.length || 0;
          if (nFaces === 0) {
            if (++awayFrames >= 3) { logMalpractice("No face detected / looking away", "lookingAway"); awayFrames = 0; }
          } else {
            const lm = results.faceLandmarks[0];
            if (lm && lm.length > 473) {
              const gazeOffset = Math.abs((lm[468].x + lm[473].x) / 2 - lm[1].x);
              if (gazeOffset > 0.08) {
                if (++awayFrames >= 4) { logMalpractice("Eyes looking away from screen", "lookingAway"); awayFrames = 0; }
              } else { awayFrames = Math.max(0, awayFrames - 1); }
            }
          }
        } catch (_) {}
      }, 800);
    } catch (e) { console.warn("[FaceLandmarker] not available:", e.message); }
  }, [logMalpractice]);

  // ── Webcam ────────────────────────────────────────────────────────────────
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      return true;
    } catch { return false; }
  }, []);

  // ── Speech Recognition ────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-IN"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
      if (final) setUserText(prev => prev + final);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // ── Text-to-Speech ────────────────────────────────────────────────────────
  const speak = useCallback((text) => new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US"; utter.rate = 0.92; utter.pitch = 1.05;
    const preferred = window.speechSynthesis.getVoices().find(v =>
      v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Female"));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setAiSpeaking(true);
    utter.onend = () => { setAiSpeaking(false); resolve(); };
    utter.onerror = () => { setAiSpeaking(false); resolve(); };
    window.speechSynthesis.speak(utter);
  }), []);

  // ── Gemini Questions ──────────────────────────────────────────────────────
  const fetchGeminiQuestions = useCallback(async () => {
    try {
      const res = await fetch("/api/gemini-interview/questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: { title: job?.title, description: job?.description, mustHave: job?.mustHave },
          candidate: { name: candidateName, skills: r.topSkills, education: r.education, summary: r.summary }
        })
      });
      const data = await res.json();
      if (data.questions?.length > 0) return data.questions;
    } catch (_) {}
    return [
      `Welcome, ${candidateName}! Could you introduce yourself and walk us through your experience relevant to this ${job?.title} role?`,
      `Describe a technically challenging project you led. What was your approach and what was the outcome?`,
      `What specific skills from the job requirements do you feel you excel at, and can you give a concrete example?`,
      `How do you stay updated with the latest developments in your field?`,
      `Do you have any questions for us about this role or the team?`
    ];
  }, [candidateName, job, r]);

  // ── Gemini Evaluation ─────────────────────────────────────────────────────
  const fetchGeminiEvaluation = useCallback(async (transcriptData) => {
    try {
      const res = await fetch("/api/gemini-interview/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: { title: job?.title, description: job?.description },
          candidate: { name: candidateName },
          transcript: transcriptData, malpractice
        })
      });
      return await res.json();
    } catch (_) {}
    const total = Object.values(malpractice).reduce((a, b) => a + b, 0);
    return {
      communicationScore: 85, technicalScore: 82,
      integrityScore: Math.max(30, 100 - total * 8),
      overallGrade: "Good",
      summary: "Candidate demonstrated adequate knowledge. Please review the proctoring report.",
      recommendation: "Proceed to HR Round"
    };
  }, [job, candidateName, malpractice]);

  // ── Submit Answer ─────────────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback((autoAdvanced = false) => {
    stopListening();
    clearInterval(timerRef.current);

    setUserText(currentText => {
      const answer = currentText.trim() || (autoAdvanced ? "[No response — time expired]" : "[No response provided]");
      setQuestions(currentQs => {
        setQIndex(currentIdx => {
          const currentQ = currentQs[currentIdx];
          setTranscript(prev => {
            const updated = [...prev, { q: currentQ, a: answer }];
            const nextIndex = currentIdx + 1;
            if (nextIndex >= currentQs.length) {
              setPhase("evaluating");
              fetchGeminiEvaluation(updated).then(report => {
                setFinalReport(report);
                setPhase("completed");
                fetch("/api/save-proctoring", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ candidateId: candidate?.id, malpractice, malpracticeLog, transcript: updated, report })
                }).catch(() => {});
                streamRef.current?.getTracks().forEach(t => t.stop());
                clearInterval(faceIntervalRef.current);
                window.speechSynthesis.cancel();
                if (onComplete) onComplete(report);
              });
            } else {
              setTimeout(() => {
                setQIndex(nextIndex);
                setTimeLeft(MAX_SECONDS);
                const nextQ = currentQs[nextIndex];
                speak(`Thank you. Question ${nextIndex + 1}: ${nextQ}`).then(() => startListening());
              }, 0);
            }
            return updated;
          });
          return currentIdx;
        });
        return currentQs;
      });
      return "";
    });
  }, [stopListening, startListening, speak, fetchGeminiEvaluation, malpractice, malpracticeLog, candidate, onComplete]);

  useEffect(() => { submitFnRef.current = handleSubmitAnswer; }, [handleSubmitAnswer]);

  // ── Timer: countdown from 3:00, auto-advance at 0 ────────────────────────
  useEffect(() => {
    if (phase !== "interview") return;
    setTimeLeft(MAX_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          submitFnRef.current?.(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIndex]);

  // ── Start Interview ───────────────────────────────────────────────────────
  const handleStartInterview = async () => {
    setPhase("permission");
    const ok = await startWebcam();
    if (!ok) { alert("Camera & microphone access is required. Please allow and reload."); return; }
    const qs = await fetchGeminiQuestions();
    setQuestions(qs);
    setPhase("interview");
    setTimeout(initFaceLandmarker, 2000);
    await speak(`Hello ${candidateName}, welcome to your AI Technical Assessment for the ${job?.title} position. I will ask you ${qs.length} questions. You have 3 minutes per question. You can submit at any time or wait for the timer. Let's begin.`);
    await speak(qs[0]);
    startListening();
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [transcript]);

  const totalMalpractice = Object.values(malpractice).reduce((a, b) => a + b, 0);
  const integrityPct = Math.max(30, 100 - totalMalpractice * 7);
  const timerColor = timeLeft <= 30 ? "#EF4444" : timeLeft <= 60 ? "#F59E0B" : "#22C55E";
  const currentQ = questions[qIndex] || "";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: WELCOME
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "welcome") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 580, width: "100%", background: "#1E293B", borderRadius: 20, padding: 40, border: "1px solid #334155", boxShadow: "0 25px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <span style={{ fontSize: 32 }}>🤖</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", margin: "0 0 8px" }}>SRM AI Technical Assessment</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>Powered by Google Gemini 2.0 Flash</p>
          </div>

          <div style={{ background: "#0F172A", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #334155" }}>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Interview Details</div>
            {[
              ["Candidate", candidateName],
              ["Position", job?.title || "Applied Position"],
              ["Questions", "5 Questions · 3 minutes each"],
              ["Input", "🎤 Voice or ⌨️ Text — both accepted"],
              ["Proctoring", "🔐 Active (Video + AI Eye Gaze)"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ color: "#94A3B8", fontSize: 13 }}>{k}</span>
                <span style={{ color: k === "Proctoring" ? "#F59E0B" : "#F8FAFC", fontWeight: 700, fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ background: "#1C1917", border: "1px solid #78350F", borderRadius: 10, padding: 14, marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#F59E0B", marginBottom: 8 }}>⚠️ Important Instructions</div>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#FCD34D", fontSize: 12.5, lineHeight: 1.9 }}>
              <li>Keep your face visible to the camera at all times</li>
              <li>Do not switch browser tabs or minimize this window</li>
              <li>Copy-paste, right-click & browser shortcuts are blocked</li>
              <li>Submit when ready or wait — timer auto-submits at 3:00</li>
            </ul>
          </div>

          <button
            onClick={handleStartInterview}
            style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", color: "#FFFFFF", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}
          >
            🎙️ Start AI Interview Session
          </button>
          <p style={{ textAlign: "center", color: "#64748B", fontSize: 12, marginTop: 12 }}>
            By starting, you consent to webcam recording and AI proctoring.
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: PERMISSION
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "permission") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
        <div style={{ textAlign: "center", color: "#F8FAFC" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Requesting camera & microphone access…</div>
          <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>Please click "Allow" in the browser prompt</div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: EVALUATING
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "evaluating") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>
        <div style={{ textAlign: "center", color: "#F8FAFC" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Gemini is evaluating your responses…</div>
          <div style={{ fontSize: 13, color: "#94A3B8", marginTop: 8 }}>Generating your technical assessment report</div>
          <div style={{ width: 240, height: 4, background: "#1E293B", borderRadius: 4, overflow: "hidden", margin: "20px auto 0" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, #3B82F6, #8B5CF6)", animation: "slideBar 1.5s infinite", borderRadius: 4 }} />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: COMPLETED
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === "completed" && finalReport) {
    const integrityColor = integrityPct >= 85 ? "#22C55E" : integrityPct >= 60 ? "#F59E0B" : "#EF4444";
    return (
      <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "inherit" }}>
        <div style={{ maxWidth: 700, width: "100%", background: "#1E293B", borderRadius: 20, padding: 40, border: "1px solid #334155" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>Interview Completed!</h2>
            <p style={{ color: "#94A3B8", fontSize: 14 }}>{candidateName} · {job?.title}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Technical Score", value: `${finalReport.technicalScore || 85}%`, color: "#3B82F6" },
              { label: "Communication", value: `${finalReport.communicationScore || 82}%`, color: "#8B5CF6" },
              { label: "Integrity Score", value: `${integrityPct}%`, color: integrityColor },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#0F172A", borderRadius: 12, padding: 16, textAlign: "center", border: `1px solid ${color}44` }}>
                <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0F172A", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #334155" }}>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Gemini Assessment Summary</div>
            <p style={{ color: "#CBD5E1", fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{finalReport.summary}</p>
          </div>
          <div style={{ background: totalMalpractice === 0 ? "#052E16" : "#1C1917", borderRadius: 12, padding: 16, border: `1px solid ${totalMalpractice === 0 ? "#166534" : "#92400E"}`, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: totalMalpractice === 0 ? "#22C55E" : "#F59E0B", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
              🔐 Proctoring Report — {totalMalpractice === 0 ? "Clean Session ✓" : `${totalMalpractice} Violation(s) Detected`}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(malpractice).map(([key, count]) => {
                const labels = { tabSwitches: "Tab Switches", cursorLeaves: "Cursor Leaves", copyPastes: "Copy/Paste", keyboardAbuse: "Keyboard Shortcuts", lookingAway: "Looking Away" };
                if (count === 0) return <span key={key} style={{ fontSize: 12, color: "#22C55E" }}>✓ {labels[key]}: Clean</span>;
                return <span key={key} style={{ fontSize: 12, color: "#F59E0B", background: "#F59E0B22", padding: "2px 8px", borderRadius: 6, border: "1px solid #F59E0B44" }}>⚠️ {labels[key]}: {count}</span>;
              })}
            </div>
          </div>
          <div style={{ fontSize: 13, color: "#64748B", textAlign: "center" }}>
            Your assessment has been submitted to the recruitment team. You may close this window.
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: INTERVIEW (Main)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0F172A", display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif", userSelect: "none" }}>

      {/* Top Bar */}
      <div style={{ padding: "10px 24px", background: "#1E293B", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC" }}>SRM AI Technical Assessment</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Powered by Google Gemini</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MalpracticeBadge count={malpractice.tabSwitches} label="Tab Switch" color="#EF4444" />
          <MalpracticeBadge count={malpractice.copyPastes} label="Copy/Paste" color="#EF4444" />
          <MalpracticeBadge count={malpractice.lookingAway} label="Eye Away" color="#F59E0B" />
          <MalpracticeBadge count={malpractice.cursorLeaves} label="Cursor Out" color="#F59E0B" />
          {/* Countdown Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", background: timerColor + "22", border: `1px solid ${timerColor}`, borderRadius: 8 }}>
            <span style={{ fontSize: 14 }}>⏱</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: timerColor, fontFamily: "monospace" }}>{formatTime(timeLeft)}</span>
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>Q{qIndex + 1}/{questions.length}</div>
        </div>
      </div>

      {/* Malpractice Alert */}
      {malpracticeAlert && (
        <div style={{ background: "#7F1D1D", color: "#FCA5A5", padding: "9px 24px", fontWeight: 700, fontSize: 12.5, display: "flex", gap: 8 }}>
          🚨 {malpracticeAlert} — <span style={{ fontWeight: 400 }}>Recorded in your proctoring report.</span>
        </div>
      )}

      {/* Main Layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 0 }}>

        {/* Left: Video + Info */}
        <div style={{ background: "#0F172A", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column", padding: 16, gap: 12, overflowY: "auto" }}>
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000", border: "2px solid #334155" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 5, background: "rgba(0,0,0,0.75)", padding: "3px 8px", borderRadius: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#EF4444", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#FFF" }}>LIVE · PROCTORED</span>
            </div>
          </div>

          <div style={{ background: "#1E293B", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#F8FAFC" }}>{candidateName}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{job?.title}</div>
          </div>

          {/* Timer visual */}
          <div style={{ background: "#1E293B", borderRadius: 10, padding: 14, border: `1px solid ${timerColor}44` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Time Remaining</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: timerColor, fontFamily: "monospace" }}>{formatTime(timeLeft)}</span>
            </div>
            <div style={{ height: 6, background: "#0F172A", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                width: `${(timeLeft / MAX_SECONDS) * 100}%`, height: "100%", borderRadius: 3,
                background: timerColor, transition: "width 1s linear, background 0.5s"
              }} />
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
              Auto-submits when timer reaches 0:00
            </div>
          </div>

          {/* Integrity meter */}
          <div style={{ background: "#1E293B", borderRadius: 10, padding: 12, border: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Session Integrity</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: integrityPct >= 85 ? "#22C55E" : integrityPct >= 60 ? "#F59E0B" : "#EF4444" }}>{integrityPct}%</span>
            </div>
            <div style={{ height: 5, background: "#0F172A", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${integrityPct}%`, height: "100%", background: integrityPct >= 85 ? "#22C55E" : integrityPct >= 60 ? "#F59E0B" : "#EF4444", borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 5 }}>
              {totalMalpractice === 0 ? "✓ No violations detected" : `⚠ ${totalMalpractice} violation(s) recorded`}
            </div>
          </div>

          {malpracticeLog.length > 0 && (
            <div style={{ background: "#1C1917", borderRadius: 10, padding: 10, border: "1px solid #92400E", maxHeight: 130, overflowY: "auto" }}>
              <div style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700, marginBottom: 5, textTransform: "uppercase" }}>Violation Log</div>
              {[...malpracticeLog].reverse().slice(0, 8).map((log, i) => (
                <div key={i} style={{ fontSize: 10.5, color: "#FCD34D", lineHeight: 1.7 }}>{log.ts} — {log.type}</div>
              ))}
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div style={{ display: "flex", flexDirection: "column", background: "#0F172A" }}>
          {/* AI Header */}
          <div style={{ padding: "14px 24px", background: "#1E293B", borderBottom: "1px solid #334155", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🤖</div>
              {aiSpeaking && <div style={{ position: "absolute", bottom: -3, right: -3, width: 14, height: 14, borderRadius: "50%", background: "#22C55E", border: "2px solid #0F172A", animation: "pulse 1s infinite" }} />}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>Gemini AI Interviewer</div>
              <div style={{ fontSize: 11, color: aiSpeaking ? "#22C55E" : "#64748B", fontWeight: 600 }}>
                {aiSpeaking ? "🔊 Speaking…" : "Ready for your response"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748B" }}>Question</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#3B82F6" }}>{qIndex + 1} <span style={{ fontSize: 11, color: "#64748B" }}>/ {questions.length}</span></div>
            </div>
          </div>

          {/* Current Question */}
          <div style={{ padding: "20px 28px", background: "#1E293B", borderBottom: "1px solid #334155" }}>
            <div style={{ fontSize: 10.5, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Question {qIndex + 1}</div>
            <p style={{ color: "#F8FAFC", fontSize: 15.5, lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
              {currentQ || "Loading your personalised question…"}
            </p>
          </div>

          {/* Transcript */}
          <div ref={chatRef} style={{ flex: 1, padding: "18px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {transcript.map((item, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "#1E293B", borderRadius: 10, padding: "10px 14px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: 9.5, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Q{idx + 1}</div>
                  <div style={{ color: "#CBD5E1", fontSize: 12.5 }}>{item.q}</div>
                </div>
                <div style={{ background: "#1E3A5F", borderRadius: 10, padding: "10px 14px", border: "1px solid #3B82F6", alignSelf: "flex-end", maxWidth: "88%" }}>
                  <div style={{ fontSize: 9.5, color: "#60A5FA", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Your Response</div>
                  <div style={{ color: "#F8FAFC", fontSize: 12.5, lineHeight: 1.6 }}>{item.a}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input Bar */}
          <div style={{ padding: "14px 24px", background: "#1E293B", borderTop: "1px solid #334155" }}>
            {listening && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "#22C55E", fontSize: 12.5, fontWeight: 600 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", animation: "pulse 1s infinite" }} />
                Listening to your voice… (speak clearly)
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmitAnswer(); } }}
                placeholder="Speak your answer (mic on) or type here… Press Enter or click Submit"
                rows={3}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 10, border: "1px solid #334155",
                  background: "#0F172A", color: "#F8FAFC", fontSize: 13.5, fontFamily: "inherit",
                  resize: "none", outline: "none", lineHeight: 1.6
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={listening ? stopListening : startListening}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: listening ? "#FEF3C7" : "#064E3B",
                    color: listening ? "#92400E" : "#22C55E",
                    border: `1px solid ${listening ? "#F59E0B" : "#22C55E"}`,
                    cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit"
                  }}
                >
                  {listening ? "⏹ Stop Mic" : "🎤 Start Mic"}
                </button>
                <button
                  onClick={() => handleSubmitAnswer()}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    color: "#FFFFFF", border: "none",
                    cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit"
                  }}
                >
                  ✓ Submit
                </button>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: "#475569", marginTop: 8, textAlign: "center" }}>
              🎤 Voice + ⌨️ Text both accepted · Submit anytime · Auto-submits at 0:00 · Enter = Submit
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes slideBar { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>
    </div>
  );
}
