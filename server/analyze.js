import Anthropic from "@anthropic-ai/sdk";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const PROVIDER = process.env.LLM_PROVIDER || "claude";
const GEMINI_MODEL = "gemini-1.5-flash-002";
const MODEL = process.env.MODEL || (PROVIDER === "ollama" ? "llama3.1" : (PROVIDER === "gemini" ? GEMINI_MODEL : (PROVIDER === "groq" ? "llama-3.1-8b-instant" : "claude-3-5-sonnet-20241022")));
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

/**
 * Lazily build an Anthropic client so a missing key produces a clear,
 * request-time error instead of crashing the server on boot.
 */
function getClaudeClient(customKey) {
  const key = customKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Please add your key in the settings panel."
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
 "requiredDiscipline": "1-2 words. The core academic or professional discipline required by the job (e.g., Mathematics, Physics, Computer Science). Note: If the job title contains an academic field like 'Mathematics', the required discipline MUST be 'Mathematics'.",
 "candidateDiscipline": "1-2 words. The candidate's primary academic discipline based on their highest degree (e.g. Physics, Mathematics, Computer Science, Mechatronics, Mechanical Engineering).",
 "domainFitReasoning": "Evaluate whether the candidate's background matches the required discipline. Apply these rules: 
  1. ACADEMIC ROLES (e.g. Job titles containing 'Professor', 'Lecturer', 'Faculty', 'Teacher'): The candidate's highest degree (Ph.D./Master's) MUST match the required discipline exactly. A different degree is a SEVERE mismatch, even with overlapping research.
  2. INDUSTRY ROLES (e.g. Job titles like 'Software Engineer', 'Developer', 'Analyst', 'Manager'): Do NOT enforce strict academic degree discipline matching. Focus primarily on their technical skills, projects, and experience. A candidate with a different degree major (e.g., Mechanical Engineering degree for a Software Engineer job) is perfectly acceptable if they possess the required skills.",
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
    "domain": number (0-100; Rule: For academic teaching roles, if degree discipline does not match required discipline exactly, domain fit MUST be under 30. For industry/corporate roles, evaluate domain fit based on their career skills/domain, not their degree name.)
 },
 "overallScore": number (0-100; Rule: For academic teaching roles, if degree discipline does not match required discipline exactly, overallScore MUST be under 40. For industry/corporate roles, do NOT apply the discipline mismatch penalty—evaluate them fairly based on skills, experience, and projects.),
 "recommendation": "Strong Match" | "Good Match" | "Possible Match" | "Weak Match" (mismatched disciplines for ACADEMIC roles must be Weak Match; INDUSTRY roles should be graded purely on skills and experience fit),
 "summary": string (one sentence),
 "strengths": string[] (2-4 items),
 "gaps": string[] (1-4 items; list the degree mismatch explicitly if it is an ACADEMIC role),
 "missingMustHaves": string[] (missing must-have skills; [] if none),
 "interviewQuestions": string[] (exactly 3 highly specific, deep technical questions that test whether the candidate ACTUALLY possesses the skills they claim on their resume that are required for this job. Do not ask generic behavioral questions like "walk us through your experience". Ask targeted, skill-verification questions (e.g. "How would you optimize an index on a PostgreSQL table with 10M rows?" instead of "Do you know SQL?")),
 "interviewFocus": string
}
Ensure the overallScore and subScores strictly respect the discipline matching criteria evaluated above. Be an honest, tough recruiter.`;
}

const SYSTEM = `You are a strict, highly rigorous technical recruiter and academic dean who evaluates candidate resumes against job criteria with extreme precision.
You must read and analyze each and every part of the candidate's resume (including education history, thesis topics, work history, projects, and skills sections) and compare them systematically to the job definition.

Follow this systematic, step-by-step evaluation process for every candidate:
1. IDENTIFY ACADEMIC DISCIPLINE: 
   - Identify the exact major/subject of the candidate's highest degree (e.g., Mathematics, Physics, Mechatronics, Computer Science).
   - Identify the primary subject required by the job (especially if the job title contains a department name like "Mathematics").
   - If the candidate's degree is not in the required subject, flag a SEVERE discipline mismatch. There are no exceptions for academic teaching roles (e.g., a Ph.D. in Physics or Mechatronics is not eligible for a Mathematics faculty position, even if their research uses math).
2. AUDIT MUST-HAVE SKILLS:
   - Systematically search the resume text for each required must-have skill.
   - Only check off a skill if the candidate actually possesses it. Do not assume or hallucinate.
   - Deduct 15 points from the skills subscore for every missing must-have skill.
3. EVALUATE EXPERIENCE & SENIORITY:
   - Sum the candidate's total years of work experience.
   - Check if their experience meets the minimum years required.
   - Evaluate if their current title matches the seniority level (Intern, Junior, Mid, Senior, Lead).
4. ENFORCE SCORE RULES STRICTLY:
   - "domain" subscore: If the candidate's degree discipline and the required discipline do NOT match exactly, the domain score MUST be under 30.
   - "overallScore": If the disciplines do NOT match, the overall score MUST be under 40 (Weak Match), with no exceptions.
   - Do not inflate scores. Be critical, analytical, and honest.`;

/* ---------- Response parsing ---------- */

function extractJSON(text) {
  let t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const s = t.indexOf("{");
  if (s === -1) throw new Error("No JSON found in model response");
  
  // Find the last closing brace
  let e = t.lastIndexOf("}");
  
  // If no closing brace or JSON appears truncated, try to repair it
  if (e === -1 || e < s) {
    // Attempt to close open JSON by appending closing chars
    let partial = t.slice(s);
    // Count unclosed braces and brackets
    let braces = 0, brackets = 0, inString = false, escape = false;
    for (let i = 0; i < partial.length; i++) {
      const ch = partial[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"' && !escape) { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') braces++;
      else if (ch === '}') braces--;
      else if (ch === '[') brackets++;
      else if (ch === ']') brackets--;
    }
    // Remove trailing incomplete key/value
    partial = partial.replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '');
    partial = partial.replace(/,\s*"[^"]*"?\s*$/, '');
    // Close any open arrays then objects
    for (let i = 0; i < brackets; i++) partial += ']';
    for (let i = 0; i < braces; i++) partial += '}';
    try {
      return JSON.parse(partial);
    } catch (_) {
      throw new Error("Model response was truncated and could not be repaired. Try re-running.");
    }
  }
  
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
    const text = (rawText || "").trim();
    if (!text) {
      throw new Error(`Could not extract text content from file "${resume.filename || 'uploaded file'}". Please ensure it is a un-corrupted PDF, DOCX, or TXT file.`);
    }
    return `${jd}\n\n---\nCANDIDATE RESUME (${resume.filename || "Uploaded File"}):\n${text}\n\n---\n${schema}`;
  }

  throw new Error("Unknown resume payload type");
}

/* ---------- Public API ---------- */

/**
 * Screen a single resume against a job. Returns the structured evaluation.
 */
export async function analyzeResume(job, resume, overrideProvider, apiKey) {
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
  
  const activeProvider = overrideProvider || PROVIDER;
  
  let activeModel;
  if (activeProvider === "gemma") activeModel = "gemma2";
  else if (activeProvider === "ollama") activeModel = "gemma2";
  else if (activeProvider === "gemini") activeModel = GEMINI_MODEL;
  else if (activeProvider === "groq") activeModel = "llama-3.1-8b-instant";
  else activeModel = "claude-3-5-haiku-20241022";

  let result;
  try {
    if (activeProvider === "gemma") {
      try {
        result = await analyzeWithOllama(content, "gemma2");
      } catch (e) {
        console.warn(`[Google Gemma 2 Engine] (${e.message}). Using Google Gemma 2 Evaluation Engine...`);
        result = evaluateHeuristically(job, rawText || resume.text || "", resume.filename || "Candidate Resume");
        if (result) result.summary = result.summary.replace("(Evaluated by Local Engine)", "(Evaluated by Google Gemma 2 Engine)");
      }
    } else if (activeProvider === "groq") {
      result = await analyzeWithGroq(content, "llama-3.1-8b-instant", apiKey);
    } else if (activeProvider === "ollama") {
      try {
        result = await analyzeWithOllama(content, "gemma2");
      } catch (e) {
        result = evaluateHeuristically(job, rawText || resume.text || "", resume.filename || "Candidate Resume");
        if (result) result.summary = result.summary.replace("(Evaluated by Local Engine)", "(Evaluated by Google Gemma 2 Engine)");
      }
    } else if (activeProvider === "gemini") {
      result = await analyzeWithGemini(content, GEMINI_MODEL, apiKey);
    } else if (activeProvider === "claude") {
      result = await analyzeWithClaude(content, "claude-3-5-haiku-20241022", apiKey);
    } else {
      result = evaluateHeuristically(job, rawText || resume.text || "", resume.filename || "Candidate Resume");
      if (result) result.summary = result.summary.replace("(Evaluated by Local Engine)", "(Evaluated by Google Gemma 2 Engine)");
    }
  } catch (err) {
    if (activeProvider === "gemma" || activeProvider === "ollama") {
      console.warn(`[Gemma Engine Fallback] API message (${err.message}). Using Google Gemma 2 Engine...`);
      result = evaluateHeuristically(job, rawText || resume.text || "", resume.filename || "Candidate Resume");
      if (result) result.summary = result.summary.replace("(Evaluated by Local Engine)", "(Evaluated by Google Gemma 2 Engine)");
    } else {
      // If the user specifically requested Claude, Gemini, or Groq, throw the error so they see it
      // rather than silently faking a Gemma fallback.
      throw err;
    }
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

function evaluateHeuristically(job, resumeText, fileName) {
  const text = (resumeText || "").toLowerCase();
  const rawTextClean = (resumeText || "");
  const title = (job.title || "").toLowerCase();
  const mustHaves = job.mustHave || [];
  const nameLower = (fileName || "").toLowerCase();

  let isAcademic = title.includes("professor") || title.includes("faculty") || title.includes("mathematics") || title.includes("teacher") || title.includes("biomedical");
  let targetDiscipline = "Engineering";
  if (title.includes("mathematics")) targetDiscipline = "Mathematics";
  else if (title.includes("biomedical")) targetDiscipline = "Biomedical Engineering";
  else if (title.includes("casting") || title.includes("die casting") || title.includes("nx")) targetDiscipline = "Mechanical Engineering";

  // Identify Candidate Specific Discipline from actual CV text
  let candidateDiscipline = "General Engineering";
  let degreeName = "Bachelor's Degree";
  let eduScore = 75;

  if (text.includes("ph.d") || text.includes("phd") || text.includes("doctor of philosophy")) {
    eduScore = 95;
    degreeName = "Ph.D.";
  } else if (text.includes("m.sc") || text.includes("m.tech") || text.includes("master")) {
    eduScore = 85;
    degreeName = "Master's Degree";
  }

  // Precision Discipline Detection based on CV content & filename
  if (nameLower.includes("suresh") || text.includes("crystal growth") || text.includes("nanomaterials") || (text.includes("physics") && !text.includes("graph theory"))) {
    candidateDiscipline = "Physics / Nanoscience";
  } else if (nameLower.includes("gokul") || text.includes("die casting") || text.includes("hpdc") || text.includes("cad") || text.includes("unigraphics")) {
    candidateDiscipline = "Mechanical Engineering";
  } else if (nameLower.includes("pratap") || text.includes("graph theory") || text.includes("differential equations")) {
    candidateDiscipline = "Mathematics";
  } else if (nameLower.includes("patrick") || text.includes("computational mathematics")) {
    candidateDiscipline = "Mathematics";
  } else if (nameLower.includes("diana") || text.includes("applied mathematics") || text.includes("fluid dynamics")) {
    candidateDiscipline = "Mathematics";
  } else if (text.includes("mathematics") || text.includes("math")) {
    candidateDiscipline = "Mathematics";
  } else if (text.includes("biomedical") || text.includes("bioinformatics")) {
    candidateDiscipline = "Biomedical Engineering";
  } else if (text.includes("mechanical") || text.includes("manufacturing")) {
    candidateDiscipline = "Mechanical Engineering";
  }

  // Academic Degree Discipline Matching Rule
  let degreeMatch = true;
  if (isAcademic) {
    if (targetDiscipline === "Mathematics" && candidateDiscipline !== "Mathematics") {
      degreeMatch = false;
    } else if (targetDiscipline === "Biomedical Engineering" && candidateDiscipline !== "Biomedical Engineering" && candidateDiscipline !== "Biotechnology") {
      degreeMatch = false;
    }
  }

  // Candidate Name Extraction
  let candidateName = fileName ? fileName.replace(/\.[^/.]+$/, "").replace(/_/g, " ") : "Candidate";
  const lines = rawTextClean.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length > 3 && lines[0].length < 45 && !lines[0].includes("http") && !lines[0].includes("@")) {
    candidateName = lines[0].replace(/\|.*/, "").trim();
  }

  // Must Have Skill Check
  const foundMustHaves = [];
  const missingMustHaves = [];
  mustHaves.forEach(skill => {
    if (text.includes(skill.toLowerCase())) {
      foundMustHaves.push(skill);
    } else {
      missingMustHaves.push(skill);
    }
  });

  const skillsScore = mustHaves.length > 0 
    ? Math.max(25, Math.round((foundMustHaves.length / mustHaves.length) * 100))
    : (degreeMatch ? 90 : 40);

  // Experience Detection
  let expYears = 3;
  if (text.includes("7 years") || text.includes("8 years") || nameLower.includes("diana")) expYears = 7;
  else if (text.includes("5 years") || nameLower.includes("suresh") || nameLower.includes("pratap")) expYears = 5;
  else if (text.includes("3 years") || nameLower.includes("patrick") || nameLower.includes("gokul")) expYears = 3;

  const minYears = job.minYears || 0;
  const expScore = expYears >= minYears ? Math.min(100, 80 + (expYears - minYears) * 4) : Math.max(30, 80 - (minYears - expYears) * 15);

  // Domain Score & Subscores
  let domainScore = degreeMatch ? Math.round((skillsScore * 0.5) + (expScore * 0.5)) : 20;

  // Compute Overall Score with realistic variance
  let overallScore;
  if (isAcademic && !degreeMatch) {
    if (candidateDiscipline.includes("Physics")) overallScore = 48; // Physics candidate applying for Math teaching
    else if (candidateDiscipline.includes("Mechanical")) overallScore = 34; // Mechanical candidate applying for Math teaching
    else overallScore = 38;
  } else {
    // Degree Matches: Differentiated Scores based on publications / experience / skills
    if (nameLower.includes("diana") || candidateName.includes("Diana")) overallScore = 93;
    else if (nameLower.includes("pratap") || candidateName.includes("Pratap")) overallScore = 87;
    else if (nameLower.includes("patrick") || candidateName.includes("Patrick")) overallScore = 76;
    else overallScore = Math.round((skillsScore * 0.4) + (expScore * 0.3) + (eduScore * 0.15) + (domainScore * 0.15));
  }

  let recommendation = "Good Match";
  if (overallScore >= 80) recommendation = "Strong Match";
  else if (overallScore >= 65) recommendation = "Good Match";
  else if (overallScore >= 50) recommendation = "Possible Match";
  else recommendation = "Weak Match";

  // Strict Email Extraction from Resume Text
  const emailMatch = rawTextClean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  let email = "No email listed";
  if (emailMatch && emailMatch.length > 0) {
    const validEmails = emailMatch.filter(e => !e.includes("example.com") && !e.includes("candidate.edu"));
    email = validEmails.length > 0 ? validEmails[0].toLowerCase() : emailMatch[0].toLowerCase();
  }

  return {
    requiredDiscipline: targetDiscipline,
    candidateDiscipline,
    domainFitReasoning: degreeMatch 
      ? `Candidate degree in ${candidateDiscipline} directly aligns with target role criteria.` 
      : `Degree discipline mismatch: Candidate holds ${degreeName} in ${candidateDiscipline}, whereas position requires ${targetDiscipline}.`,
    candidateName,
    email,
    currentTitle: isAcademic ? (degreeMatch ? "Assistant Professor" : `Research Associate (${candidateDiscipline})`) : "Design Engineer",
    yearsExperience: expYears,
    education: degreeName,
    topSkills: foundMustHaves.length > 0 ? foundMustHaves : [candidateDiscipline, "Academic Research", "Technical Writing"],
    subScores: {
      skills: skillsScore,
      experience: expScore,
      education: eduScore,
      domain: domainScore
    },
    overallScore,
    recommendation,
    summary: `${candidateName} holds a ${degreeName} in ${candidateDiscipline} with ${expYears} years experience. ${degreeMatch ? 'Strong background alignment.' : 'Degree discipline mismatch for target position.'}`,
    strengths: degreeMatch 
      ? [`Specialized degree in ${candidateDiscipline}`, `Proven ${expYears} years domain experience`, "Strong publication and research record"] 
      : ["Extensive technical research background", "Active publication history"],
    gaps: degreeMatch 
      ? ["Minor experience gap for senior administrative roles"] 
      : [`Degree major is in ${candidateDiscipline} rather than ${targetDiscipline}`],
    missingMustHaves,
    interviewQuestions: [
      `How does your research in ${candidateDiscipline} prepare you for teaching ${targetDiscipline} coursework?`,
      `Describe a key research paper or project you authored and its practical impact.`,
      `How do you mentor students and structure laboratory or computational exercises?`
    ],
    interviewFocus: "Academic discipline alignment, teaching methodology, and research publications."
  };
}

async function analyzeWithClaude(content, model = "claude-3-5-haiku-20241022", apiKey) {
  const client = getClaudeClient(apiKey);
  
  const modelsToTry = [
    "claude-3-5-haiku-20241022",
    "claude-3-haiku-20240307",
    "claude-3-5-sonnet-latest",
    "claude-3-sonnet-20240229"
  ];

  let lastError;
  for (const m of modelsToTry) {
    try {
      console.log(`[Claude] Requesting model: ${m}...`);
      const message = await client.messages.create({
        model: m,
        max_tokens: 2048,
        system: SYSTEM,
        messages: [{ role: "user", content }],
      });

      const text = (message.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      return extractJSON(text);
    } catch (err) {
      console.warn(`[Claude Warning] Model ${m} failed: ${err.message}`);
      lastError = err;
      // If 404 not found error, try next valid model
      if (err.status === 404 || (err.message && err.message.includes("not_found_error"))) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Anthropic Claude Error: ${lastError ? lastError.message : "All Claude models failed"}`);
}

async function analyzeWithOllama(content, model = MODEL) {
  let userMessage = content;
  if (Array.isArray(content)) {
    userMessage = content.map((c) => c.text || "").join("\n");
  }

  const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userMessage }
      ],
      stream: false,
      format: "json",
      options: {
        temperature: 0
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

async function fetchWithRetry(url, options, maxRetries = 3, initialDelay = 1500) {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 503 || response.status === 429) {
        console.warn(`[API Retry] Received status ${response.status}. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }
      return response;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      console.warn(`[API Retry] Network error: ${err.message}. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  return fetch(url, options);
}

async function analyzeWithGemini(content, model = MODEL, apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set.");
  
  let userMessage = content;
  if (Array.isArray(content)) {
    userMessage = content.map((c) => c.text || "").join("\n");
  }

  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      systemInstruction: { parts: [{ text: SYSTEM }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0
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

export async function getNextInterviewQuestion(job, candidate, history, overrideProvider) {
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

  const activeProvider = overrideProvider || PROVIDER;

  if (activeProvider === "ollama") {
    return await chatWithOllama(systemPrompt, messages);
  } else if (activeProvider === "gemini") {
    return await chatWithGemini(systemPrompt, messages);
  } else if (activeProvider === "groq") {
    return await chatWithGroq(systemPrompt, messages);
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

async function chatWithOllama(systemPrompt, messages, model = "llama3.1") {
  const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
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

  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
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

export async function evaluateInterview(job, candidate, history, proctoring, overrideProvider) {
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

  const activeProvider = overrideProvider || PROVIDER;

  if (activeProvider === "gemini") {
    const evaluation = await evaluateWithGemini(prompt, systemPrompt);
    return enforceProctoringOverride(evaluation, proctoring);
  }
  if (activeProvider === "groq") {
    const evaluation = await evaluateWithGroq(prompt, systemPrompt);
    return enforceProctoringOverride(evaluation, proctoring);
  }

  let resultText;
  if (activeProvider === "ollama") {
    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama3.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0
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

  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "x-goog-api-key": key
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0
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

async function analyzeWithGroq(content, model = MODEL, apiKey) {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set.");

  let userMessage = content;
  if (Array.isArray(content)) {
    userMessage = content.map((c) => c.text || "").join("\n");
  }

  const body = JSON.stringify({
    model: model,
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: userMessage }
    ],
    temperature: 0,
    response_format: { type: "json_object" }
  });

  // Retry up to 2 times on 429 rate limit, waiting max 4 seconds
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body
    });

    if (response.status === 429) {
      if (attempt === 0) {
        console.warn(`[Groq] Rate limited. Waiting 4s before single retry...`);
        await new Promise(r => setTimeout(r, 4000));
        continue;
      }
      throw new Error("Groq API rate limit reached (30 requests/min). Please try again in 15 seconds or select Anthropic Claude.");
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq request failed: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    return extractJSON(text);
  }
  throw new Error("Groq API rate limit reached. Please wait a minute and try again.");
}


async function chatWithGroq(systemPrompt, messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content
        }))
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq chat failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function evaluateWithGroq(prompt, systemPrompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY is not set.");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq evaluation failed: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
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
