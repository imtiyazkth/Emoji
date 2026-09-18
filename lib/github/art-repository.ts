import type { ArtRepository } from "../cache/art-repository";
import { assertValidEmojiArtDb, type EmojiArtDb, type EmojiArtRecord } from "../utils/schemas";
import { isGithubConfigured, readJsonFile } from "./client";
import { localReadJson } from "./local-store";
import { githubPath, localFileName } from "./paths";
import { enqueueMutation, forceFlush } from "./write-queue";
import { fuzzyMatch } from "../matching/fuzzy";
import { AppError, ErrorCode } from "../utils/errors";

const FILE_NAME = "emoji_art_db.json";
const READ_CACHE_TTL_MS = 30_000; // Layer 2 (server memory cache) TTL

let readCache: { data: EmojiArtDb; expiresAt: number } | null = null;

async function loadDb(): Promise<EmojiArtDb> {
  if (readCache && readCache.expiresAt > Date.now()) return readCache.data;
  try {
    const { data } = isGithubConfigured()
      ? await readJsonFile<EmojiArtDb>(githubPath(FILE_NAME))
      : await localReadJson<EmojiArtDb>(localFileName(FILE_NAME));
    const validated = assertValidEmojiArtDb(data);
    readCache = { data: validated, expiresAt: Date.now() + READ_CACHE_TTL_MS };
    return validated;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(ErrorCode.GITHUB_READ_ERROR, "Could not load art database", { retryable: true });
  }
}

function invalidateReadCache() {
  readCache = null;
}

/**
 * GitHub-JSON-backed implementation of ArtRepository. All writes go
 * through the single-writer batched queue (write-queue.ts) rather than
 * committing directly, per the "never let every user write to GitHub"
 * rule. Reads are served from a short-TTL in-memory cache (Layer 2)
 * sitting in front of the GitHub JSON store (Layer 3).
 */
export class GitHubArtRepository implements ArtRepository {
  async findByIntentKey(intentKey: string): Promise<EmojiArtRecord | null> {
    const db = await loadDb();
    return db.emoji_arts.find((a) => a.intent_key === intentKey && a.status === "active") ?? null;
  }

  async findSimilar(query: string, style: string, threshold = 0.8): Promise<EmojiArtRecord | null> {
    const db = await loadDb();
    let best: { record: EmojiArtRecord; score: number } | null = null;
    for (const record of db.emoji_arts) {
      if (record.status !== "active") continue;
      if (record.style !== style) continue;
      for (const keyword of record.user_intent_keywords) {
        const result = fuzzyMatch(query, keyword, threshold);
        if (result.isMatch && (!best || result.similarity > best.score)) {
          best = { record, score: result.similarity };
        }
      }
    }
    return best?.record ?? null;
  }

  async create(record: EmojiArtRecord): Promise<EmojiArtRecord> {
    enqueueMutation((db) => ({ ...db, emoji_arts: [...db.emoji_arts, record] }));
    invalidateReadCache();
    return record;
  }

  async update(id: string, patch: Partial<EmojiArtRecord>): Promise<EmojiArtRecord | null> {
    const db = await loadDb();
    const existing = db.emoji_arts.find((a) => a.id === id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updated_at: new Date().toISOString() };
    enqueueMutation((current) => ({
      ...current,
      emoji_arts: current.emoji_arts.map((a) => (a.id === id ? updated : a)),
    }));
    invalidateReadCache();
    return updated;
  }

  async incrementHit(id: string): Promise<void> {
    enqueueMutation((db) => ({
      ...db,
      emoji_arts: db.emoji_arts.map((a) => (a.id === id ? { ...a, hit_count: a.hit_count + 1 } : a)),
    }));
    invalidateReadCache();
  }

  async listFeatured(limit = 12): Promise<EmojiArtRecord[]> {
    const db = await loadDb();
    return db.emoji_arts.filter((a) => a.featured && a.status === "active").slice(0, limit);
  }

  async listAll(): Promise<EmojiArtRecord[]> {
    const db = await loadDb();
    return db.emoji_arts;
  }
}

/** Escape hatch for admin "save now" flows and tests. */
export async function flushArtWritesNow(): Promise<void> {
  await forceFlush();
}
