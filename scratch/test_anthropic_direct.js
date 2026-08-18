import { analyzeResume } from "../server/analyze.js";

const sampleJob = {
  title: "Senior Machine Learning Engineer",
  seniority: "Senior",
  minYears: 5,
  location: "Bengaluru",
  description: "Senior Machine Learning Engineer to design and deploy ML models using Python, PyTorch, SQL.",
  mustHave: ["Python", "PyTorch", "SQL"],
  niceToHave: ["Docker", "Kubernetes"]
};

const sampleResume = {
  type: "text",
  text: "Jane Doe\nEmail: jane.doe@example.com\n5+ years of experience as a Machine Learning Engineer proficient in Python, PyTorch, SQL, and AWS."
};

async function runTest() {
  console.log("Testing analyzeResume with Anthropic provider...");
  try {
    const result = await analyzeResume(sampleJob, sampleResume, "claude", process.env.ANTHROPIC_API_KEY || "");
    console.log("SUCCESS:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("ERROR CAUGHT:", err.message);
    console.error("FULL STACK:", err.stack);
  }
}

runTest();
