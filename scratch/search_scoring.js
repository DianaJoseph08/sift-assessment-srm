import fs from "fs";

const files = [
  "D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/server/index.js",
  "D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/server/analyze.js"
];

files.forEach(file => {
  const content = fs.readFileSync(file, "utf-8");
  const lines = content.split("\n");
  console.log(`\n--- Searching in ${file} ---`);
  lines.forEach((line, idx) => {
    if (line.includes("score") || line.includes("interview") || line.includes("evaluate")) {
      if (line.includes("function") || line.includes("const") || line.includes("let")) {
        console.log(`${idx + 1}: ${line.trim()}`);
      }
    }
  });
});
