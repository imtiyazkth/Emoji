/**
 * Diagnostic script: confirms GITHUB_TOKEN/OWNER/REPO/BRANCH are
 * configured correctly and that a read + no-op write round-trip
 * succeeds against the real GitHub Contents API. Does NOT run in CI
 * (requires real secrets) — run manually before first production
 * deploy: `npm run test:github-write`.
 */
import { readJsonFile, writeJsonFile, isGithubConfigured } from "../lib/github/client";

async function main() {
  if (!isGithubConfigured()) {
    console.log("ℹ️  GITHUB_TOKEN/OWNER/REPO not set — skipping (local filesystem mode is active).");
    return;
  }

  console.log("Reading data/emoji_art_db.json from GitHub…");
  const { data, sha } = await readJsonFile<Record<string, unknown>>("emoji_art_db.json");
  console.log(`✅ Read succeeded. total_records=${(data as any).total_records}, sha=${sha.slice(0, 8)}…`);

  console.log("Performing a no-op write (same content) to verify write permissions…");
  const result = await writeJsonFile("emoji_art_db.json", data, sha, "chore: verify GitHub write access (no-op)");
  console.log(`✅ Write succeeded. new sha=${result.sha.slice(0, 8)}…`);
}

main().catch((err) => {
  console.error("❌ GitHub write test failed:", err);
  process.exit(1);
});
