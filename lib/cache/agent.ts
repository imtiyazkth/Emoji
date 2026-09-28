import type { ArtRepository } from "./art-repository";
import { GitHubArtRepository } from "../github/art-repository";
import { getAiProvider } from "../ai/provider";
import { buildIntentKey } from "./cache-key";
import { renderPlaceholders } from "../unicode";
import { contentHashFor } from "../utils/content-hash";
import type { EmojiArtRecord } from "../utils/schemas";
import { assertSafeInput } from "../moderation/check";
import { AppError } from "../utils/errors";

export interface CacheAgentInput {
  text: string;
  style: string;
  category?: string;
  language: string;
}

export interface CacheAgentResult {
  art: string;
  source: "cache" | "ai" | "fallback";
  matchMethod: "exact" | "fuzzy" | "ai_generated" | "fallback_template";
  category: string;
  style: string;
  recordId?: string;
}

const FALLBACK_TEMPLATE = "✨ [USER_TEXT] ✨";

/**
 * Request flow (AI-first — this intentionally reverses the original
 * "never call AI if cache can satisfy" cost-saving default):
 *
 *   normalize -> call Groq -> validate output -> moderate -> cache
 *   (queued write) -> return
 *
 *   Groq unavailable/rate-limited/timed out?
 *     -> exact intent-key match in the cached DB
 *     -> fuzzy/token-overlap match in the cached DB
 *     -> a featured cached template for the requested style
 *     -> deterministic local template (always succeeds)
 *
 * Every successful AI generation is still queued into the GitHub-backed
 * store (lib/github/write-queue.ts) so it becomes part of the fallback
 * pool for future requests when Groq is down. A non-retryable failure
 * (e.g. the AI's own output tripping moderation) is surfaced directly
 * rather than silently masked by a cache fallback.
 */
export class CacheAgent {
  constructor(private repo: ArtRepository = new GitHubArtRepository()) {}

  async resolve(input: CacheAgentInput): Promise<CacheAgentResult> {
    assertSafeInput(input.text);

    const intentKey = buildIntentKey(input.category ?? input.style, input.text);

    try {
      const provider = getAiProvider();
      const { output, promptVersion } = await provider.generateEmojiArt(input);
      assertSafeInput(output.art);

      const contentHash = contentHashFor(output.art, output.style);
      const duplicate = await this.repo.findByContentHash(contentHash);
      if (duplicate) {
        // Groq generated something we already have byte-for-byte (for this
        // style) — reuse the existing record instead of writing a new one,
        // per the spec's duplicate-prevention rule. The user still gets a
        // freshly-generated answer; we just don't bloat the cache with it.
        await this.repo.incrementHit(duplicate.id);
        return this.toResult(duplicate, "ai", "ai_generated", input.text);
      }

      const now = new Date().toISOString();
      const record: EmojiArtRecord = {
        id: `art_${Date.now().toString(36)}`,
        intent_key: intentKey,
        user_intent_keywords: [...new Set([input.text.toLowerCase(), ...output.keywords])],
        category: output.category,
        style: output.style,
        language: input.language,
        hit_count: 0,
        quality_score: 0.5,
        prompt_version: promptVersion,
        content_hash: contentHash,
        source: "groq_ai_generated",
        status: "active",
        featured: false,
        created_at: now,
        updated_at: now,
        raw_text_art: output.art,
      };
      await this.repo.create(record); // queued write, not a direct commit
      return this.toResult(record, "ai", "ai_generated", input.text);
    } catch (err) {
      if (err instanceof AppError && !err.retryable) {
        // e.g. the AI's own output tripped moderation — surface it, don't
        // paper over it with a cached result.
        throw err;
      }

      // Groq is down/rate-limited/timed out — fall back to the existing
      // cached database, in the same priority order the original
      // cache-first design used: exact -> fuzzy -> featured -> deterministic.
      const exact = await this.repo.findByIntentKey(intentKey);
      if (exact) {
        await this.repo.incrementHit(exact.id);
        return this.toResult(exact, "cache", "exact", input.text);
      }

      const threshold = Number(process.env.FUZZY_MATCH_THRESHOLD || 0.8);
      const fuzzy = await this.repo.findSimilar(input.text, input.style, threshold);
      if (fuzzy) {
        await this.repo.incrementHit(fuzzy.id);
        return this.toResult(fuzzy, "cache", "fuzzy", input.text);
      }

      const featured = await this.repo.listFeatured(1);
      if (featured[0]) {
        return this.toResult(featured[0], "fallback", "fallback_template", input.text);
      }

      return {
        art: renderPlaceholders(FALLBACK_TEMPLATE, { USER_TEXT: input.text }),
        source: "fallback",
        matchMethod: "fallback_template",
        category: input.category ?? "general",
        style: input.style,
      };
    }
  }

  private toResult(
    record: EmojiArtRecord,
    source: CacheAgentResult["source"],
    method: CacheAgentResult["matchMethod"],
    userText: string
  ): CacheAgentResult {
    return {
      art: renderPlaceholders(record.raw_text_art, { USER_TEXT: userText }),
      source,
      matchMethod: method,
      category: record.category,
      style: record.style,
      recordId: record.id,
    };
  }
}
