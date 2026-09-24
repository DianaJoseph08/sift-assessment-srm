import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/* ============================================================
   COGNIHIRE — AI VIDEO INTERVIEW & PROCTORING PLATFORM
   - Powered by AI
   - Video feed + Voice input + Text fallback
   - Full malpractice detection
   - 3-minute countdown per question (auto-advance at 0:00)
   - Candidate can submit at any time
   ============================================================ */

const MAX_SECONDS = 180; // 3 minutes per question, auto-advance at 0
const MEDIAPIPE_WASM = "/wasm";
const FACE_MODEL_URL = "/face_landmarker.task";

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

export default function VideoInterview({ candidate, job, llmProvider, onComplete }) {
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
  const [faceMissing, setFaceMissing] = useState(false);
  const [faceDetectorReady, setFaceDetectorReady] = useState(false);
  const [detectorStatus, setDetectorStatus] = useState("initializing"); // "initializing" | "ready" | "error"
  const [lastSkippedByAbsence, setLastSkippedByAbsence] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_SECONDS);
  const [finalReport, setFinalReport] = useState(null);

  // Malpractice
  const [malpractice, setMalpractice] = useState({
    tabSwitches: 0, cursorLeaves: 0, copyPastes: 0, keyboardAbuse: 0,
    lookingAway: 0, faceAbsent: 0, headTurned: 0,
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
  const lastClickRef = useRef(0); // tracks last click time to suppress false cursor-out events
  const lastVideoTimeRef = useRef(-1);
  const lastTypingTimeRef = useRef(0); // tracks keyboard input to suppress false gaze-down events while typing
  const isTypingFocusedRef = useRef(false); // tracks if textarea is currently focused
  const faceMissingRef = useRef(false);
  useEffect(() => { faceMissingRef.current = faceMissing; }, [faceMissing]);

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
      // Ignore for 600ms after any click — prevents false positive on Submit button
      if (Date.now() - lastClickRef.current < 600) return;
      if (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)
        logMalpractice("Cursor left browser window", "cursorLeaves");
    };
    const onMouseDown = () => { lastClickRef.current = Date.now(); };
    const onPaste = (e) => { e.preventDefault(); logMalpractice("Paste attempt blocked", "copyPastes"); };
    const onCopy = (e) => { e.preventDefault(); logMalpractice("Copy attempt blocked", "copyPastes"); };
    const onCtxMenu = (e) => { e.preventDefault(); logMalpractice("Right-click menu blocked", "copyPastes"); };
    const onKeyDown = (e) => {
      lastTypingTimeRef.current = Date.now();
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
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("paste", onPaste);
    document.addEventListener("copy", onCopy);
    document.addEventListener("contextmenu", onCtxMenu);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("visibilitychange", onVisChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("contextmenu", onCtxMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [phase, logMalpractice]);

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

  // ── MediaPipe Face Gaze ───────────────────────────────────────────────────
  const initFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerRef.current) return;
    try {
      setDetectorStatus("initializing");
      const wasmPath = window.location.origin + MEDIAPIPE_WASM;
      const modelPath = window.location.origin + FACE_MODEL_URL;
      console.log("[FaceLandmarker] Initializing local fileset resolver from", wasmPath);
      const filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);
      let fl;
      try {
        fl = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: modelPath, delegate: "GPU" },
          runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true,
        });
        console.log("[FaceLandmarker] Loaded with GPU delegate successfully");
      } catch (gpuErr) {
        console.warn("[FaceLandmarker] GPU delegate failed, trying CPU:", gpuErr?.message);
        fl = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: { modelAssetPath: modelPath, delegate: "CPU" },
          runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true,
        });
        console.log("[FaceLandmarker] Loaded with CPU delegate successfully");
      }
      faceLandmarkerRef.current = fl;
      setFaceDetectorReady(true);
      setDetectorStatus("ready");

      let awayFrames = 0;
      let gazeAwayFrames = 0;
      let headTurnFrames = 0;

      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);

      faceIntervalRef.current = setInterval(() => {
        if (!videoRef.current || !faceLandmarkerRef.current) return;
        const video = videoRef.current;
        if (video.paused) video.play().catch(() => {});
        if (video.readyState < 2 || video.videoWidth === 0) return;

        try {
          const now = performance.now();
          if (now <= lastVideoTimeRef.current) return;
          lastVideoTimeRef.current = now;

          const results = faceLandmarkerRef.current.detectForVideo(video, now);
          const nFaces = results?.faceLandmarks?.length || 0;

          if (nFaces === 0) {
            setFaceMissing(true);
            faceMissingRef.current = true;
            gazeAwayFrames = 0;
            headTurnFrames = 0;

            // Instantly clear draft answer & stop mic
            if (awayFrames === 0) {
              setUserText(""); 
              stopListening();
            }
            
            awayFrames++;
            // If absent for 3 consecutive intervals (~2.1 seconds): auto-submit question and advance
            if (awayFrames >= 3) {
              logMalpractice("Left camera frame during question — auto-submitted (fraud prevention)", "faceAbsent");
              setLastSkippedByAbsence(true);
              if (submitFnRef.current) submitFnRef.current(true);
              awayFrames = 0;
            }
          } else {
            setFaceMissing(false);
            faceMissingRef.current = false;
            awayFrames = 0;
            const lm = results.faceLandmarks[0];
            if (lm && lm.length > 473) {
              const irisX = (lm[468].x + lm[473].x) / 2;
              const noseX = lm[1].x;
              const gazeOffset = Math.abs(irisX - noseX);

              // Head yaw (turned left/right significantly away from screen)
              const distLeft = Math.abs(noseX - lm[33].x);
              const distRight = Math.abs(lm[263].x - noseX);
              const yawRatio = distLeft > distRight ? distLeft / (distRight || 0.001) : distRight / (distLeft || 0.001);
              const isHeadTurned = yawRatio > 2.5;
              
              // Detect if user is on a mobile device
              const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
              
              // Check if candidate is actively typing or focused on typing input
              const isTypingActive = isTypingFocusedRef.current || (Date.now() - lastTypingTimeRef.current < 5000);

              // 1. Horizontal gaze away from screen (reading from a secondary screen or another person)
              const isLookingAwayHorizontally = gazeOffset > 0.15;

              // 2. Downward glance
              // NOTE: Looking down at keyboard or textarea is completely expected while typing!
              let isLookingDownExcessively = false;
              if (!isMobile && !isTypingActive) {
                const upperFace = Math.abs(lm[1].y - lm[10].y);
                const lowerFace = Math.abs(lm[152].y - lm[1].y);
                const pitchRatio = lowerFace / (upperFace || 1);
                
                const blendshapes = results.faceBlendshapes?.[0]?.categories;
                let lookDownScore = 0;
                if (blendshapes) {
                  lookDownScore = Math.max(
                    blendshapes.find(c => c.categoryName === "eyeLookDownLeft")?.score || 0,
                    blendshapes.find(c => c.categoryName === "eyeLookDownRight")?.score || 0
                  );
                }
                // Only flag if candidate is completely inactive/not typing AND head is deeply tilted down
                if (pitchRatio < 0.60 || lookDownScore > 0.70) {
                  isLookingDownExcessively = true;
                }
              }

              const isLookingAway = isLookingAwayHorizontally || isLookingDownExcessively;

              if (isHeadTurned) {
                if (++headTurnFrames >= 3) {
                  logMalpractice("Head turned away from camera screen", "headTurned");
                  headTurnFrames = 0;
                }
              } else {
                headTurnFrames = Math.max(0, headTurnFrames - 1);
              }

              if (isLookingAway && !isHeadTurned) {
                if (++gazeAwayFrames >= 4) {
                  logMalpractice(isMobile ? "Eyes looking away from screen" : "Eyes looking outside screen / notes", "lookingAway");
                  gazeAwayFrames = 0;
                }
              } else {
                gazeAwayFrames = Math.max(0, gazeAwayFrames - 1);
              }
            }
          }
        } catch (detErr) {
          console.error("[FaceLandmarker detection error]:", detErr);
        }
      }, 700);
    } catch (e) {
      console.error("[FaceLandmarker] Initialization error:", e);
      setDetectorStatus("error");
    }
  }, [logMalpractice, stopListening]);

  // ── Webcam ────────────────────────────────────────────────────────────────
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream; // just store it — don't touch videoRef yet (it doesn't exist)
      return true;
    } catch { return false; }
  }, []);

  // Attach stream to video element once interview phase renders it
  useEffect(() => {
    if (phase === "interview" && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      const onReady = () => {
        video.play().catch(e => console.warn("[Webcam play]:", e));
      };
      if (video.readyState >= 1) {
        onReady();
      } else {
        video.onloadedmetadata = onReady;
      }
      initFaceLandmarker();
    }
  }, [phase, initFaceLandmarker]);

  // ── AI Questions ──────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    try {
      let apiKey = undefined;
      if (llmProvider === "claude") apiKey = localStorage.getItem("ANTHROPIC_API_KEY");
      else if (llmProvider === "gemini") apiKey = localStorage.getItem("GEMINI_API_KEY");
      else if (llmProvider === "groq") apiKey = localStorage.getItem("GROQ_API_KEY");

      const res = await fetch("/api/interview/video-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: { title: job?.title, description: job?.description, mustHave: job?.mustHave },
          candidate: { name: candidateName, skills: r.topSkills, education: r.education, summary: r.summary },
          provider: llmProvider,
          apiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch AI questions");
      if (data.questions?.length > 0) return data.questions;
    } catch (err) {
      alert("Error initializing AI Interview: " + err.message + "\n\nPlease ensure your API key is correct and you have an active internet connection.");
      window.close(); // Close the interview window on critical failure
    }
    return [];
  }, [candidateName, job, r, llmProvider]);

  const fetchEvaluation = useCallback(async (transcriptData) => {
    try {
      let apiKey = undefined;
      if (llmProvider === "claude") apiKey = localStorage.getItem("ANTHROPIC_API_KEY");
      else if (llmProvider === "gemini") apiKey = localStorage.getItem("GEMINI_API_KEY");
      else if (llmProvider === "groq") apiKey = localStorage.getItem("GROQ_API_KEY");

      const remarksList = [];
      if (malpractice.faceAbsent > 0) {
        remarksList.push(`MALPRACTICE / FRAUD DETECTED: Candidate was absent from the camera screen ${malpractice.faceAbsent} time(s) during questions. Questions were automatically closed and submitted.`);
      }
      if (malpractice.headTurned > 0) {
        remarksList.push(`Candidate turned head away from screen ${malpractice.headTurned} time(s).`);
      }
      if (malpractice.lookingAway > 0) {
        remarksList.push(`Candidate looked outside screen or down at notes/desk ${malpractice.lookingAway} time(s).`);
      }
      if (malpractice.tabSwitches > 0) {
        remarksList.push(`Candidate switched browser tabs ${malpractice.tabSwitches} time(s).`);
      }
      if (malpractice.copyPastes > 0) {
        remarksList.push(`Candidate attempted copy/paste ${malpractice.copyPastes} time(s).`);
      }
      const proctoringPayload = {
        ...malpractice,
        remarks: remarksList.join(" ") || "No proctoring violations detected. Candidate remained focused on screen throughout the session."
      };

      const res = await fetch("/api/interview/video-evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job: { title: job?.title, description: job?.description },
          candidate: { name: candidateName },
          transcript: transcriptData,
          malpractice: proctoringPayload,
          provider: llmProvider,
          apiKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to evaluate interview");
      return data;
    } catch (err) {
      alert("Error generating evaluation: " + err.message);
      return {
        communicationScore: 0, technicalScore: 0,
        integrityScore: 0,
        overallGrade: "Error",
        summary: "Assessment failed due to server error: " + err.message,
        recommendation: "Manual Review Required"
      };
    }
  }, [job, candidateName, malpractice, llmProvider]);

  // ── Submit Answer ─────────────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback((autoAdvanced = false) => {
    stopListening();
    clearInterval(timerRef.current);
    window.speechSynthesis.cancel();
    setAiSpeaking(false);

    setUserText(currentText => {
      let answer = currentText.trim();
      if (autoAdvanced && (faceMissingRef.current || lastSkippedByAbsence)) {
        answer = "[NO RESPONSE — Candidate left the camera frame during the question. Question was automatically closed to prevent searching for answers elsewhere (fraud detection).]";
      } else if (!answer && autoAdvanced) {
        answer = "[No response — time expired]";
      } else if (!answer) {
        answer = "[No response provided]";
      }
      setLastSkippedByAbsence(false);
      setQuestions(currentQs => {
        setQIndex(currentIdx => {
          const currentQ = currentQs[currentIdx];
          setTranscript(prev => {
            const updated = [...prev, { q: currentQ, a: answer }];
            const nextIndex = currentIdx + 1;
            if (nextIndex >= currentQs.length) {
              setPhase("evaluating");
              fetchEvaluation(updated).then(report => {
                setFinalReport(report);
                setPhase("completed");
                
                // Log proctoring stats
                fetch("/api/save-proctoring", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ candidateId: candidate?.id, malpractice, malpracticeLog, transcript: updated, report })
                }).catch(() => {});
                
                // SAVE THE EVALUATION TO THE DATABASE
                if (candidate?.id) {
                  fetch("/api/candidate-interview-submit", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      candidateId: candidate.id,
                      score: report.technicalScore,
                      summary: report.summary,
                      transcript: updated,
                      proctoring: malpractice
                    })
                  }).catch(() => {});
                }

                streamRef.current?.getTracks().forEach(t => t.stop());
                clearInterval(faceIntervalRef.current);
                window.speechSynthesis.cancel();
                if (onComplete) onComplete(report);
              });
            } else {
              setQIndex(nextIndex);
              setTimeLeft(MAX_SECONDS);
            }
            return updated;
          });
          return currentIdx;
        });
        return currentQs;
      });
      return "";
    });
  }, [stopListening, fetchEvaluation, malpractice, malpracticeLog, candidate, onComplete, lastSkippedByAbsence]);

  useEffect(() => { submitFnRef.current = handleSubmitAnswer; }, [handleSubmitAnswer]);

  // ── Timer: countdown from 3:00 per question, auto-submits at 0:00 ──────────
  useEffect(() => {
    if (phase !== "interview") return;
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
    initFaceLandmarker();
    const qs = await fetchQuestions();
    setQuestions(qs);
    setQIndex(0);
    setTimeLeft(MAX_SECONDS);
    setPhase("interview");
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
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F8FAFC", margin: "0 0 8px" }}>CogniHire · {job?.companyName ? `${job.companyName} ` : ""}Technical Assessment</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>Autonomous AI Interviewer &amp; Proctoring Engine</p>
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

          <div style={{ background: "#1C1917", border: "1px solid #78350F", borderRadius: 10, padding: 16, marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B", marginBottom: 10 }}>⚠️ Important Instructions — Anti-Fraud &amp; Proctoring Rules</div>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: "#FCD34D", fontSize: 12.5, lineHeight: 2 }}>
              <li>Keep your face <strong>visible and looking directly at the screen</strong> at all times.</li>
              <li style={{ color: "#FCA5A5", fontWeight: 800, fontSize: 13 }}>
                🚨 <strong>Do NOT move away from the screen</strong>: If you leave the camera frame during a question, that question will be <strong>immediately closed and auto-submitted</strong> as a fraud prevention measure, and you will <strong>NOT be able to answer it again</strong>.
              </li>
              <li>👁️ <strong>Do NOT look outside the screen</strong> or down at notes/devices: Looking away or turning your head is actively tracked and flagged as malpractice.</li>
              <li>⏱️ <strong>Timer starts automatically</strong>: You have 3 minutes per question. The timer begins as soon as you enter.</li>
              <li>🔊 <strong>Voice assistance is optional</strong>: Click <strong>"🔊 Hear Question (Optional)"</strong> anytime if you want the AI to read the question out loud.</li>
              <li>🚫 Tab switches, minimizing windows, copy-paste, and keyboard shortcuts are strictly blocked and recorded.</li>
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
          <div style={{ fontSize: 20, fontWeight: 800 }}>AI is evaluating your responses...</div>
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
              { label: "Technical Score", value: `${finalReport.technicalScore ?? 85}%`, color: "#3B82F6" },
              { label: "Communication", value: `${finalReport.communicationScore ?? 82}%`, color: "#8B5CF6" },
              { label: "Integrity Score", value: `${integrityPct}%`, color: integrityColor },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#0F172A", borderRadius: 12, padding: 16, textAlign: "center", border: `1px solid ${color}44` }}>
                <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#0F172A", borderRadius: 12, padding: 16, marginBottom: 20, border: "1px solid #334155" }}>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>AI Assessment Summary</div>
            <p style={{ color: "#CBD5E1", fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{finalReport.summary}</p>
          </div>
          <div style={{ background: totalMalpractice === 0 ? "#052E16" : "#1C1917", borderRadius: 12, padding: 16, border: `1px solid ${totalMalpractice === 0 ? "#166534" : "#92400E"}`, marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: totalMalpractice === 0 ? "#22C55E" : "#F59E0B", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
              🔐 Proctoring Report — {totalMalpractice === 0 ? "Clean Session ✓" : `${totalMalpractice} Violation(s) Detected`}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(malpractice).map(([key, count]) => {
                const labels = {
                  tabSwitches: "Tab Switches",
                  cursorLeaves: "Cursor Leaves",
                  copyPastes: "Copy/Paste",
                  keyboardAbuse: "Keyboard Shortcuts",
                  lookingAway: "Looking Outside Screen",
                  faceAbsent: "Left Camera Frame (Fraud Risk)",
                  headTurned: "Head Turned Away"
                };
                if (count === 0) return <span key={key} style={{ fontSize: 12, color: "#22C55E" }}>✓ {labels[key] || key}: Clean</span>;
                return <span key={key} style={{ fontSize: 12, color: key === "faceAbsent" ? "#EF4444" : "#F59E0B", background: key === "faceAbsent" ? "#EF444422" : "#F59E0B22", padding: "2px 8px", borderRadius: 6, border: `1px solid ${key === "faceAbsent" ? "#EF4444" : "#F59E0B"}44` }}>⚠️ {labels[key] || key}: {count}</span>;
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
            <div style={{ fontSize: 13, fontWeight: 800, color: "#F8FAFC" }}>CogniHire · {job?.companyName ? `${job.companyName} ` : ""}Assessment</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>AI Video Proctoring Active</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <MalpracticeBadge count={malpractice.faceAbsent} label="Left Camera" color="#EF4444" />
          <MalpracticeBadge count={malpractice.headTurned} label="Head Turned" color="#F59E0B" />
          <MalpracticeBadge count={malpractice.lookingAway} label="Looking Away" color="#F59E0B" />
          <MalpracticeBadge count={malpractice.tabSwitches} label="Tab Switch" color="#EF4444" />
          <MalpracticeBadge count={malpractice.copyPastes} label="Copy/Paste" color="#EF4444" />
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
          <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#000", border: `2px solid ${faceMissing ? "#EF4444" : "#334155"}` }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", display: "block", transform: "scaleX(-1)" }} />
            
            {/* Real-time Detector Badge */}
            <div style={{ position: "absolute", top: 8, left: 8, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.8)", padding: "4px 10px", borderRadius: 6, zIndex: 10 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: faceMissing ? "#EF4444" : detectorStatus === "ready" ? "#22C55E" : "#F59E0B",
                animation: faceMissing ? "pulse 0.8s infinite" : "none"
              }} />
              <span style={{ fontSize: 10.5, fontWeight: 800, color: "#FFF", letterSpacing: "0.03em" }}>
                {detectorStatus === "initializing"
                  ? "AI PROCTOR: INITIALIZING..."
                  : faceMissing
                  ? "AI PROCTOR: NO FACE DETECTED"
                  : "AI PROCTOR: FACE VERIFIED"}
              </span>
            </div>
            
            {/* Blocking Overlay when Face is Missing */}
            {faceMissing && (
              <div style={{
                position: "absolute", inset: 0, background: "rgba(127,29,29,0.92)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "white", padding: 16, textAlign: "center", backdropFilter: "blur(4px)", zIndex: 20
              }}>
                <span style={{ fontSize: 38, marginBottom: 8 }}>🚨</span>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#FCA5A5", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Face Not Detected
                </div>
                <div style={{ fontSize: 11.5, marginTop: 6, color: "#FEE2E2", fontWeight: 600, lineHeight: 1.5, maxWidth: 240 }}>
                  ⚠️ Do not leave the camera screen! Question will auto-submit in ~2 seconds to prevent cheating.
                </div>
              </div>
            )}
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
              <div style={{ fontSize: 14, fontWeight: 800, color: "#F8FAFC" }}>AI Interviewer ({llmProvider || "Auto"})</div>
              <div style={{ fontSize: 11, color: aiSpeaking ? "#22C55E" : faceMissing ? "#EF4444" : "#64748B", fontWeight: 600 }}>
                {aiSpeaking ? "🔊 AI reading question aloud…" : faceMissing ? "🚨 Face not detected — return to camera" : "✅ 3-minute timer running · Answer anytime"}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#64748B" }}>Question</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#3B82F6" }}>{qIndex + 1} <span style={{ fontSize: 11, color: "#64748B" }}>/ {questions.length}</span></div>
            </div>
          </div>

          {/* Current Question */}
          <div style={{ padding: "20px 28px", background: "#1E293B", borderBottom: "1px solid #334155" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 10.5, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Question {qIndex + 1} of {questions.length}
              </div>
              <button
                onClick={() => {
                  if (aiSpeaking) {
                    window.speechSynthesis.cancel();
                    setAiSpeaking(false);
                  } else if (currentQ) {
                    speak(`Question ${qIndex + 1}: ${currentQ}`);
                  }
                }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 15px",
                  background: aiSpeaking ? "#FEF3C7" : "#0F172A",
                  color: aiSpeaking ? "#B45309" : "#38BDF8",
                  border: `1px solid ${aiSpeaking ? "#F59E0B" : "#0284C7"}`,
                  borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.2s"
                }}
                title="Optional: Listen to the question read aloud by AI"
              >
                {aiSpeaking ? "⏹ Stop Voice" : "🔊 Hear Question (Optional)"}
              </button>
            </div>

            <p style={{ color: "#F8FAFC", fontSize: 15.5, lineHeight: 1.75, margin: 0, fontWeight: 500 }}>
              {currentQ || "Loading your personalised question…"}
            </p>

            {lastSkippedByAbsence && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: "#7F1D1D33", border: "1px solid #EF4444", borderRadius: 8, color: "#FCA5A5", fontSize: 12, fontWeight: 600 }}>
                ⚠️ Previous question was auto-submitted because you left the camera frame.
              </div>
            )}
          </div>

          {/* Transcript */}
          <div ref={chatRef} style={{ flex: 1, padding: "18px 28px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
            {transcript.map((item, idx) => (
              <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "#1E293B", borderRadius: 10, padding: "10px 14px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: 9.5, color: "#6366F1", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>Q{idx + 1}</div>
                  <div style={{ color: "#CBD5E1", fontSize: 12.5 }}>{item.q}</div>
                </div>
                <div style={{ background: item.a.includes("left the camera frame") ? "#450A0A" : "#1E3A5F", borderRadius: 10, padding: "10px 14px", border: `1px solid ${item.a.includes("left the camera frame") ? "#EF4444" : "#3B82F6"}`, alignSelf: "flex-end", maxWidth: "88%" }}>
                  <div style={{ fontSize: 9.5, color: item.a.includes("left the camera frame") ? "#EF4444" : "#60A5FA", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                    {item.a.includes("left the camera frame") ? "⚠️ FRAUD DETECTED — AUTO-SUBMITTED" : "Your Response"}
                  </div>
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
                onChange={(e) => {
                  lastTypingTimeRef.current = Date.now();
                  setUserText(e.target.value);
                }}
                onFocus={() => {
                  isTypingFocusedRef.current = true;
                  lastTypingTimeRef.current = Date.now();
                }}
                onBlur={() => {
                  isTypingFocusedRef.current = false;
                }}
                onKeyDown={(e) => {
                  lastTypingTimeRef.current = Date.now();
                  if (e.key === "Enter" && !e.shiftKey && !faceMissing) {
                    e.preventDefault();
                    handleSubmitAnswer();
                  }
                }}
                placeholder={faceMissing ? "🚨 Camera blocked — please return to frame to continue answering..." : "Speak your answer (mic on) or type here… Press Enter or click Submit"}
                rows={3}
                disabled={faceMissing}
                style={{
                  flex: 1, padding: "11px 14px", borderRadius: 10, border: `1px solid ${faceMissing ? "#EF4444" : "#334155"}`,
                  background: "#0F172A", color: "#F8FAFC", fontSize: 13.5, fontFamily: "inherit",
                  resize: "none", outline: "none", lineHeight: 1.6, opacity: faceMissing ? 0.4 : 1
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  disabled={faceMissing}
                  onClick={listening ? stopListening : startListening}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: listening ? "#FEF3C7" : "#064E3B",
                    color: listening ? "#92400E" : "#22C55E",
                    border: `1px solid ${listening ? "#F59E0B" : "#22C55E"}`,
                    cursor: faceMissing ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit",
                    opacity: faceMissing ? 0.4 : 1
                  }}
                >
                  {listening ? "⏹ Stop Mic" : "🎤 Start Mic"}
                </button>
                <button
                  disabled={faceMissing}
                  onClick={() => handleSubmitAnswer()}
                  style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: "linear-gradient(135deg, #3B82F6, #6366F1)",
                    color: "#FFFFFF", border: "none",
                    cursor: faceMissing ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit",
                    opacity: faceMissing ? 0.4 : 1
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
