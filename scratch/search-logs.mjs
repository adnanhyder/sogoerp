import fs from "node:fs";
import path from "node:path";

const logFile = "C:/Users/adii/.gemini/antigravity/brain/dd569116-73ed-45be-9de3-0ddd749803d8/.system_generated/logs/transcript.jsonl";

if (!fs.existsSync(logFile)) {
  console.log("Log file does not exist!");
  process.exit(0);
}

const content = fs.readFileSync(logFile, "utf8");
const lines = content.split("\n");

console.log("Searching logs...");
let matchCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) continue;
  
  if (line.includes("Leads Records") || line.includes("Total Leads") || line.includes("leadRows") || line.includes("No database records found")) {
    matchCount++;
    console.log(`\n--- Match #${matchCount} at step index ---`);
    try {
      const parsed = JSON.parse(line);
      console.log("Type:", parsed.type);
      console.log("Step Index:", parsed.step_index);
      // Print snippet of text
      const text = JSON.stringify(parsed.content || parsed.tool_calls || "");
      console.log("Snippet:", text.slice(0, 300) + "...");
    } catch {
      console.log("Raw line snippet:", line.slice(0, 300) + "...");
    }
  }
}
