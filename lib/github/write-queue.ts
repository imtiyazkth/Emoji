import { isGithubConfigured, readJsonFile, writeJsonFile } from "./client";
import { localReadJson, localWriteJson } from "./local-store";
import { githubPath, localFileName } from "./paths";
import { assertValidEmojiArtDb, type EmojiArtDb } from "../utils/schemas";
import { AppError, ErrorCode } from "../utils/errors";

/**
 * Single-writer, batched mutation queue for the GitHub JSON store.
 *
 * Never let every request write to GitHub directly — that blows through
 * rate limits and causes SHA-conflict storms under concurrency. Instead:
 *
 *   requests -> enqueue mutation -> in-memory batch -> one flush -> commit
 *
 * Flushing happens either when GITHUB_MAX_BATCH_SIZE is reached or every
 * GITHUB_BATCH_INTERVAL_MS, whichever comes first. Conflicts (stale SHA)
 * trigger refetch + re-apply + retry with exponential backoff, up to
 * MAX_RETRIES, after which the batch is moved to a dead-letter list for
 * manual/admin inspection rather than retried forever.
 *
 * NOTE: this in-memory queue is per-process. On serverless platforms
 * (Vercel) each instance has its own queue; for MVP traffic this is an
 * acceptable tradeoff documented in docs/database.md, with the durable
 * fix being a real queue (SQS/Upstash/etc.) at migration time.
 */

type Mutation = (db: EmojiArtDb) => EmojiArtDb;

const FILE_NAME = "emoji_art_db.json";
const MAX_RETRIES = 3;

let pending: Mutation[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
export const deadLetterQueue: { mutation: Mutation; error: string; at: string }[] = [];

function batchIntervalMs(): number {
  return Number(process.env.GITHUB_BATCH_INTERVAL_MS || 300000);
}
function maxBatchSize(): number {
  return Number(process.env.GITHUB_MAX_BATCH_SIZE || 50);
}

async function readDb(): Promise<{ data: EmojiArtDb; sha: string }> {
  if (isGithubConfigured()) {
    return readJsonFile<EmojiArtDb>(githubPath(FILE_NAME));
  }
  return localReadJson<EmojiArtDb>(localFileName(FILE_NAME));
}

async function writeDb(data: EmojiArtDb, sha: string): Promise<{ sha: string }> {
  if (isGithubConfigured()) {
    return writeJsonFile(githubPath(FILE_NAME), data, sha, "chore(cache): batched art DB update");
  }
  return localWriteJson(localFileName(FILE_NAME), data);
}

async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pending.length === 0) return;

  const batch = pending.splice(0, pending.length);
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    try {
      const { data, sha } = await readDb();
      let next = structuredClone(data);
      for (const mutate of batch) next = mutate(next);
      next.last_updated = new Date().toISOString();
      next.total_records = next.emoji_arts.length;

      const validated = assertValidEmojiArtDb(next); // never commit malformed JSON
      await writeDb(validated, sha);
      return;
    } catch (err) {
      attempt++;
      const isConflict = err instanceof AppError && err.status === 409;
      if (attempt >= MAX_RETRIES) {
        deadLetterQueue.push({
          mutation: (db) => batch.reduce((acc, m) => m(acc), db),
          error: err instanceof Error ? err.message : String(err),
          at: new Date().toISOString(),
        });
        return;
      }
      if (isConflict || (err instanceof AppError && err.retryable)) {
        await new Promise((r) => setTimeout(r, 200 * 2 ** attempt)); // exponential backoff
        continue;
      }
      // Non-retryable error: dead-letter immediately.
      deadLetterQueue.push({
        mutation: (db) => batch.reduce((acc, m) => m(acc), db),
        error: err instanceof Error ? err.message : String(err),
        at: new Date().toISOString(),
      });
      return;
    }
  }
}

export function enqueueMutation(mutation: Mutation): void {
  pending.push(mutation);
  if (pending.length >= maxBatchSize()) {
    void flush();
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(() => void flush(), batchIntervalMs());
  }
}

/** Force an immediate flush — used by admin "save now" actions and tests. */
export async function forceFlush(): Promise<void> {
  await flush();
}
