import type { ArtRepository } from "./art-repository";
import { GitHubArtRepository } from "../github/art-repository";
import { getAiProvider } from "../ai/provider";
import { buildIntentKey } from "./cache-key";
import { renderPlaceholders } from "../unicode";
import type { EmojiArtRecord } from "../utils/schemas";
import { assertSafeInput } from "../moderation/check";
import { AppError, ErrorCode } from "../utils/errors";

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
 * Implements the request flow from the spec:
 *   normalize -> exact match -> fuzzy match -> (semantic, if enabled) ->
 *   cache hit? return : call AI -> validate -> moderate -> cache -> return
 *
 * The guiding rule: never call the AI API when a trusted cached pattern
 * can satisfy the request. AI is the last resort, not the default path.
 */
export class CacheAgent {
  constructor(private repo: ArtRepository = new GitHubArtRepository()) {}

  async resolve(input: CacheAgentInput): Promise<CacheAgentResult> {
    assertSafeInput(input.text);

    const intentKey = buildIntentKey(input.category ?? input.style, input.text);

    // 1) Exact intent-key match
    const exact = await this.repo.findByIntentKey(intentKey);
    if (exact) {
      await this.repo.incrementHit(exact.id);
      return this.toResult(exact, "cache", "exact", input.text);
    }

    // 2) Fuzzy / token-overlap match against keyword sets for this style
    const threshold = Number(process.env.FUZZY_MATCH_THRESHOLD || 0.8);
    const fuzzy = await this.repo.findSimilar(input.text, input.style, threshold);
    if (fuzzy) {
      await this.repo.incrementHit(fuzzy.id);
      return this.toResult(fuzzy, "cache", "fuzzy", input.text);
    }

    // 3) (Semantic matching layer would run here if SEMANTIC_CACHE_ENABLED —
    //    see docs/cache-agent.md for the local-embedding-index design.)

    // 4) AI generation, with graceful fallback if the provider fails/quota exceeded.
    try {
      const provider = getAiProvider();
      const { output } = await provider.generateEmojiArt(input);
      assertSafeInput(output.art);

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
      // Graceful fallback chain: approved cache (featured) -> deterministic template.
      const featured = await this.repo.listFeatured(1);
      if (featured[0]) {
        return this.toResult(featured[0], "fallback", "fallback_template", input.text);
      }
      if (err instanceof AppError && !err.retryable) {
        // Non-retryable AI errors (e.g. moderation) should surface, not be masked.
        throw err;
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
