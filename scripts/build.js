// scripts/build.js
// Node 18+ has fetch built-in
const fs = require("fs");
const path = require("path");

const USER = process.env.HABITICA_USER_ID;
const TOKEN = process.env.HABITICA_API_TOKEN;

if (!USER || !TOKEN) {
  console.error("Missing HABITICA_USER_ID or HABITICA_API_TOKEN");
  process.exit(1);
}

async function main() {
  const res = await fetch("https://habitica.com/api/v3/user", {
    headers: {
      "x-api-user": USER,
      "x-api-key": TOKEN,
      "x-client": "haileybarc-habitica-notion-widget", // required header
      "user-agent": "haileybarc-habitica-notion-widget/1.0",
      "content-type": "application/json",
    },
  });

  if (!res.ok) {
    // Write a fallback badge so deploy still works
    const outDir = path.join(process.cwd(), "public");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "status.svg"),
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
         <rect width="200" height="50" fill="red"/>
         <text x="10" y="30" fill="white">Habitica API Error</text>
       </svg>`
    );
    process.exit(1);
  }

  const data = await res.json();

  // Grab XP bar data
  const stats = data.data.stats;
  const xp = stats.exp;
  const toNext = stats.toNextLevel;

  const progress = Math.min(100, Math.round((xp / toNext) * 100));

  // Simple SVG progress bar
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="300" height="50">
    <rect width="300" height="50" fill="#333"/>
    <rect width="${3 * progress}" height="50" fill="#4caf50"/>
    <text x="150" y="30" fill="white" text-anchor="middle" font-size="16">
      XP: ${xp} / ${toNext} (${progress}%)
    </text>
  </svg>
  `;

  const outDir = path.join(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "status.svg"), svg);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
