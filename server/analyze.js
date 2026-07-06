import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const PROVIDER = process.env.LLM_PROVIDER || "claude";
const MODEL = process.env.MODEL || (PROVIDER === "ollama" ? "llama3.1" : (PROVIDER === "gemini" ? "gemini-2.5-flash" : "claude-sonnet-4-6"));
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

/**
 * Lazily build an Anthropic client so a missing key produces a clear,
 * request-time error instead of crashing the server on boot.
 */
function getClaudeClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
    );
  }
  return new Anthropic({ apiKey: key, maxRetries: 3 });
}

/* ---------- Prompt construction ---------- */

function jobBlock(job) {
  return `JOB TITLE: ${job.title}
SENIORITY: ${job.seniority}
MINIMUM EXPERIENCE: ${job.minYears} years
LOCATION / MODE: ${job.location || "not specified"}
MUST-HAVE SKILLS: ${(job.mustHave || []).join(", ") || "not specified"}
NICE-TO-HAVE SKILLS: ${(job.niceToHave || []).join(", ") || "not specified"}

JOB DESCRIPTION:
${job.description}`;
}

function schemaBlock(job, extractedEmails = []) {
  const jobTitle = job.title || "the specified role";
  const emailsList = extractedEmails.length > 0 ? `[${extractedEmails.map(e => `"${e}"`).join(", ")}]` : "[]";

  return `Return ONLY a JSON object — no markdown, no backticks, no commentary — matching this schema:
{
 "requiredDiscipline": "1-2 words. The core academic or professional discipline required by the job (e.g. Mathematics, Physics, Computer Science, Chemistry).",
 "candidateDiscipline": "1-2 words. The candidate's primary academic or professional discipline based on their highest degree and core experience (e.g. Physics, Mathematics, Computer Science).",
 "domainFitReasoning": "Evaluate whether candidateDiscipline is a direct match for requiredDiscipline. State explicitly if they do not match.",
 "candidateName": string,
 "email": "string (the candidate's actual personal or contact email address. You MUST select it ONLY from this list of parsed emails: ${emailsList}. Choose the one that belongs to the candidate — usually the first one or the one matching/containing their name. If the list is empty or none match the candidate, return 'N/A'. Never guess, fabricate, or hallucinate an email not explicitly present in the list.)",
 "currentTitle": string,
 "yearsExperience": number,
 "education": string,
 "topSkills": string[] (max 8),
 "subScores": {
    "skills": number (0-100, deduct 15 points per missing must-have),
    "experience": number (0-100),
    "education": number (0-100),
    "domain": number (0-100; if candidateDiscipline and requiredDiscipline do NOT match, domain fit MUST be under 30)
 },
 "overallScore": number (0-100; if candidateDiscipline and requiredDiscipline do NOT match, overallScore MUST be under 40, no exceptions),
 "recommendation": "Strong Match" | "Good Match" | "Possible Match" | "Weak Match" (mismatched disciplines must be Weak Match),
 "summary": string (one sentence),
 "strengths": string[] (2-4 items),
 "gaps": string[] (1-4 items; list the domain/discipline mismatch explicitly if it exists),
 "missingMustHaves": string[] (missing must-have skills; [] if none),
 "interviewQuestions": string[] (exactly 3, tailored),
 "interviewFocus": string
}
Ensure the overallScore and subScores strictly respect the discipline matching criteria evaluated above. Be an honest, tough recruiter.`;
}

const SYSTEM =
  "You are a strict, highly rigorous technical recruiter who evaluates resumes " +
  "critically and without bias. You do not inflate scores and you heavily penalize domain mismatches. You always respond with valid JSON only.";

/* ---------- Response parsing ---------- */

function extractJSON(text) {
  let t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = t.indexOf("{");
  const e = t.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON found in model response");
  return JSON.parse(t.slice(s, e + 1));
}

/* ---------- Resume -> message content ---------- */

/**
 * Turn an uploaded resume into the `content` for the user message.
 * - PDFs are passed to the model directly as a document block.
 * - DOCX is converted to text with mammoth.
 * - Plain text / pasted text is used as-is.
 */
async function buildContent(job, resume, rawText, extractedEmails) {
  const jd = jobBlock(job);
  const schema = schemaBlock(job, extractedEmails);

  if (resume.type === "text") {
    const text = (resume.text || "").trim();
    if (!text) throw new Error("Resume text is empty");
    return `${jd}\n\n---\nCANDIDATE RESUME:\n${text}\n\n---\n${schema}`;
  }

  if (resume.type === "file") {
    const name = (resume.filename || "").toLowerCase();

    if (name.endsWith(".pdf")) {
      if (PROVIDER === "claude") {
        return [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: resume.base64,
            },
          },
          {
            type: "text",
            text: `${jd}\n\n---\nThe attached PDF is the candidate's resume.\n\n${schema}`,
          },
        ];
      } else {
        const text = rawText;
        if (!text || !text.trim()) throw new Error("Could not extract text from PDF");
        return `${jd}\n\n---\nCANDIDATE RESUME:\n${text.trim()}\n\n---\n${schema}`;
      }
    }

    let text = rawText;
    if (!text || !text.trim()) throw new Error("Could not extract text from file");
    return `${jd}\n\n---\nCANDIDATE RESUME:\n${text.trim()}\n\n---\n${schema}`;
  }

  throw new Error("Unknown resume payload type");
}

/* ---------- Public API ---------- */

/**
 * Screen a single resume against a job. Returns the structured evaluation.
 */
export async function analyzeResume(job, resume) {
  // 1. Get raw text of the resume
  let rawText = "";
  if (resume.type === "text") {
    rawText = resume.text || "";
  } else if (resume.type === "file") {
    const name = (resume.filename || "").toLowerCase();
    const buffer = Buffer.from(resume.base64 || "", "base64");
    try {
      if (name.endsWith(".pdf")) {
        const parsed = await pdfParse(buffer);
        rawText = parsed.text || "";
      } else if (name.endsWith(".docx")) {
        const out = await mammoth.extractRawText({ buffer });
        rawText = out.value || "";
      } else {
        rawText = buffer.toString("utf-8");
      }
    } catch (e) {
      console.error("Failed to extract raw text for emails:", e.message);
    }
  }

  // 2. Regex match for email addresses (case insensitive, alphanumeric with common symbols)
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const extractedEmails = Array.from(new Set((rawText.match(emailRegex) || []).map(e => e.toLowerCase())));

  // 3. Build prompt and run analysis
  const content = await buildContent(job, resume, rawText, extractedEmails);
  let result;
  if (PROVIDER === "ollama") {
    result = await analyzeWithOllama(content);
  } else if (PROVIDER === "gemini") {
    result = await analyzeWithGemini(content);
  } else {
    result = await analyzeWithClaude(content);
  }

  // 4. Post-process email extraction to enforce correctness and prevent hallucinations
  if (result) {
    if (result.email && result.email !== "N/A") {
      const cleanEmail = result.email.trim().toLowerCase();
      // Match exactly
      if (extractedEmails.includes(cleanEmail)) {
        result.email = cleanEmail;
      } else {
        // Match by substring (e.g. LLM returned "sureshscience@gmail.com" but regex list has "pesureshscience@gmail.com")
        const matched = extractedEmails.find(e => e.includes(cleanEmail) || cleanEmail.includes(e));
        if (matched) {
          result.email = matched;
        } else if (extractedEmails.length > 0) {
          // If completely mismatched, fallback to the first email found (almost always the candidate's email)
          result.email = extractedEmails[0];
        } else {
          result.email = "N/A";
        }
      }
    } else if (extractedEmails.length > 0) {
      // If LLM returned N/A but we found emails, default to the first email parsed
      result.email = extractedEmails[0];
    } else {
      result.email = "N/A";
    }
  }

  return result;
}

async function analyzeWithClaude(content) {
  const client = getClaudeClient();
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });

  const text = (message.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  return extractJSON(text);
}

async function analyzeWithOllama(content) {
  let userMessage = content;
  if (Array.isArray(content)) {
    userMessage = content.map((c) => c.text || "").join("\n");
  }

  const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMessage }
      ],
      stream: false,
      format: "json",
      options: {
        temperature: 0.1
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.message?.content || "";
  return extractJSON(text);
}

async function analyzeWithGemini(content) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  
  let userMessage = content;
  if (Array.isArray(content)) {
    userMessage = content.map((c) => c.text || "").join("\n");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: SYSTEM }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini request failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return extractJSON(text);
}

export async function getNextInterviewQuestion(job, candidate, history) {
  const candidateName = candidate.result?.candidateName || candidate.label || "Candidate";
  const skillsList = (candidate.result?.topSkills || []).join(", ") || "the skills on their resume";

  const systemPrompt = `You are a professional, polite, but highly rigorous technical interviewer at SRM Group of Institutions interviewing a candidate for the role: "${job.title}".
Candidate Name: ${candidateName}
Resume Skills: ${skillsList}

Your task is to conduct an interactive mock technical interview.
Follow these rules strictly:
1. Ask exactly ONE clear, open-ended question at a time.
2. Focus on the skills listed above. Ask about conceptual knowledge, practical experience, system design, or debugging related to those skills.
3. Respond briefly to the candidate's answer (e.g. acknowledge or probe further) and then ask the next question or transition to another skill.
4. Keep your responses concise, natural, and conversational (strictly under 3 sentences).
5. DO NOT provide any score, feedback, or summary to the candidate during the interview. Stay entirely in character.`;

  const messages = [
    { role: "user", content: `I am candidate ${candidateName}. Let's begin the interview for the role of ${job.title}.` },
    ...history.map(h => ({
      role: h.role === "interviewer" ? "assistant" : "user",
      content: h.content
    }))
  ];

  if (PROVIDER === "ollama") {
    return await chatWithOllama(systemPrompt, messages);
  } else if (PROVIDER === "gemini") {
    return await chatWithGemini(systemPrompt, messages);
  } else {
    return await chatWithClaude(systemPrompt, messages);
  }
}

async function chatWithClaude(systemPrompt, messages) {
  const client = getClaudeClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: messages,
  });
  return (response.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function chatWithOllama(systemPrompt, messages) {
  const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      stream: false,
      options: {
        temperature: 0.7
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama chat failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.message?.content || "";
}

async function chatWithGemini(systemPrompt, messages) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");

  const formattedContents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: formattedContents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.7
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini chat failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export async function evaluateInterview(job, candidate, history, proctoring) {
  const candidateName = candidate.result?.candidateName || candidate.label || "Candidate";
  const transcriptText = history.map(h => `${h.role === "interviewer" ? "Interviewer" : "Candidate"}: ${h.content}`).join("\n");

  const systemPrompt = "You are a strict, highly analytical technical assessor who evaluates mock interview transcripts critically and outputs a structured feedback report in JSON.";

  const proctoringInfo = proctoring
    ? `\nPROCTORING METRICS DURING INTERVIEW:
- Window focus losses / tab switches: ${proctoring.tabSwitches || 0}
- Copy-paste actions in input box: ${proctoring.pasteCount || 0}`
    : "";

  const prompt = `Evaluate the following interview transcript for the role of "${job.title}".
Candidate Name: ${candidateName}
Resume Skills: ${(candidate.result?.topSkills || []).join(", ")}${proctoringInfo}

Interview Transcript:
${transcriptText}

Output a JSON object ONLY with this schema:
{
  "score": number (0-100, representing a confidence score of their technical capability based on their answers. Be critical. Short, evasive, shallow, or AI-generated-looking answers must receive a low score. Note: If copy-paste actions > 0, they copy-pasted responses from an external helper (like ChatGPT) instead of typing them. In this case, you MUST heavily penalize their score below 50, even if the text looks technical!),
  "summary": "string (a concise paragraph summarizing their performance, technical depth, and specifically mentioning if suspicious copy-paste or tab switching activity was detected)"
}
Return ONLY valid JSON. Do not include any markdown formatting, code block backticks, or other text outside the JSON object.`;

  if (PROVIDER === "gemini") {
    const evaluation = await evaluateWithGemini(prompt, systemPrompt);
    return enforceProctoringOverride(evaluation, proctoring);
  }

  let resultText;
  if (PROVIDER === "ollama") {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.1
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama evaluation failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    resultText = data.message?.content || "";
  } else {
    const client = getClaudeClient();
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    resultText = (message.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
  }

  const evaluation = extractJSON(resultText);
  return enforceProctoringOverride(evaluation, proctoring);
}

async function evaluateWithGemini(prompt, systemPrompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini evaluation failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return extractJSON(text);
}

function enforceProctoringOverride(evaluation, proctoring) {
  if (!proctoring) return evaluation;

  const tabSwitches = proctoring.tabSwitches || 0;
  const pasteCount = proctoring.pasteCount || 0;

  const isFraud = pasteCount > 0 || tabSwitches > 0;

  if (isFraud) {
    console.log(`[Proctoring] Enforcing score penalty: ${pasteCount} pastes, ${tabSwitches} switches`);
    const originalScore = evaluation.score;
    evaluation.score = Math.min(evaluation.score || 0, 30);
    const warningHeader = `[PROCTORING ALERT: Serious fraud detected. Candidate completed the assessment with ${pasteCount} copy-paste actions and ${tabSwitches} tab switches. The technical score was automatically overwritten to fail.] `;
    evaluation.summary = warningHeader + (evaluation.summary || "");
  }

  return evaluation;
}
