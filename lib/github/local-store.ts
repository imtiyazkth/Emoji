import { promises as fs } from "fs";
import path from "path";

/**
 * Local filesystem fallback for the GitHub JSON store. Used automatically
 * in development when GITHUB_TOKEN/OWNER/REPO aren't set, so `npm run dev`
 * works with zero external credentials. Production should configure
 * GitHub (or a future database adapter) — see docs/database.md.
 */

const DATA_DIR = path.join(process.cwd(), "data");

export async function localReadJson<T>(fileName: string): Promise<{ data: T; sha: string }> {
  const full = path.join(DATA_DIR, fileName);
  const raw = await fs.readFile(full, "utf-8");
  // "sha" is simulated as an mtime-based token for optimistic concurrency parity.
  const stat = await fs.stat(full);
  return { data: JSON.parse(raw) as T, sha: String(stat.mtimeMs) };
}

export async function localWriteJson(fileName: string, data: unknown): Promise<{ sha: string }> {
  const full = path.join(DATA_DIR, fileName);
  await fs.writeFile(full, JSON.stringify(data, null, 2), "utf-8");
  const stat = await fs.stat(full);
  return { sha: String(stat.mtimeMs) };
}
