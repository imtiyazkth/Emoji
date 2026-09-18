/**
 * The `data/*.json` files live under a `data/` subfolder in the repo,
 * but the two storage backends address them differently:
 *
 * - GitHub Contents API paths are relative to the repo root, so they
 *   need the `data/` prefix (e.g. `data/emoji_art_db.json`).
 * - The local filesystem fallback (`lib/github/local-store.ts`) already
 *   joins against `path.join(process.cwd(), "data")`, so it wants the
 *   bare filename only (e.g. `emoji_art_db.json`) — prefixing it there
 *   would incorrectly look for `data/data/emoji_art_db.json`.
 *
 * `GITHUB_DATA_DIR` lets you point at a different folder (or repo root,
 * with an empty string) without touching call sites.
 */

const GITHUB_DATA_DIR = process.env.GITHUB_DATA_DIR ?? "data";

export function githubPath(fileName: string): string {
  return GITHUB_DATA_DIR ? `${GITHUB_DATA_DIR}/${fileName}` : fileName;
}

export function localFileName(fileName: string): string {
  return fileName; // local-store.ts already resolves against the data/ dir
}
