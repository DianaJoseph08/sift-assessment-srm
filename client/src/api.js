/**
 * Send one resume + the job definition to the backend, which proxies the
 * request to the Claude API. Returns the structured screening result.
 *
 * `resume` is one of:
 *   { type: "text", text: string }
 *   { type: "file", filename: string, base64: string }
 */
export async function analyzeCandidate(job, resume, aiConfig) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job, resume, aiConfig }),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {
      /* ignore parse failure */
    }
    throw new Error(message);
  }
  return res.json();
}

/** Read a File object into a base64 string (no data: prefix). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/** Ask the interviewer chatbot for the next question. */
export async function sendInterviewChat(job, candidate, history) {
  const res = await fetch("/api/interview/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job, candidate, history }),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  const data = await res.json();
  return data.question;
}

/** Submit the interview transcript to generate the confidence score. */
export async function evaluateInterview(job, candidate, history, proctoring) {
  const res = await fetch("/api/interview/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job, candidate, history, proctoring }),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}
