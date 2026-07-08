import fs from "fs";

const content = fs.readFileSync("D:/AI_Resume_Shortlisting/sift-resume-agent/sift-resume-agent/client/src/App.jsx", "utf-8");
const lines = content.split("\n");

console.log("Searching for 'recMeta' in App.jsx...");
lines.forEach((line, idx) => {
  if (line.includes("recMeta")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
