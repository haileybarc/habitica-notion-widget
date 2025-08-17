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
  // Get current user stats
  const res = await fetch("https://habitica.com/api/v3/user", {
    headers: {
      "x-api-user": USER,
      "x-api-key": TOKEN,
      "content-type": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Habitica API error:", res.status, await res.text());
    process.exit(1);
  }

  const json = await res.json();
  const stats = json.data.stats;

  const lvl = stats.lvl;
  const cls = stats.class || "";
  const exp = stats.exp || 0;
  const toNext = stats.toNextLevel || 1;
  const pct = Math.max(0, Math.min(100, Math.round((exp / toNext) * 100)));

  // Shields.io "endpoint" schema
  const badge = {
    schemaVersion: 1,
    label: "Habitica",
    message: `Level ${lvl} • ${pct}% XP`,
    color: "purple",
  };

  // Ensure output dir
  const outDir = path.join(process.cwd(), "public");
  fs.mkdirSync(outDir, { recursive: true });

  // Write JSON for Shields
  fs.writeFileSync(path.join(outDir, "level.json"), JSON.stringify(badge));

  // Optional: a tiny landing page (nice for testing)
  const page = `<!doctype html>
  <meta charset="utf-8">
  <title>Habitica Badge</title>
  <h1>Habitica Badge (Lily)</h1>
  <img src="https://img.shields.io/endpoint?url=${`https://` + process.env.GITHUB_REPOSITORY_OWNER + `.github.io/` + process.env.GITHUB_REPOSITORY.split("/")[1]}/level.json" alt="Habitica Badge">
  <p>Embed this in Notion using /embed → the Shields URL above.</p>`;
  fs.writeFileSync(path.join(outDir, "index.html"), page);

  console.log("Generated public/level.json and public/index.html");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
