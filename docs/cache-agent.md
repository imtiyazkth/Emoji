# Cache Agent

`lib/cache/agent.ts` implements the core cost-control principle of the
platform: **never call the AI API when an existing trusted cached
pattern can satisfy the request.**

## Matching order

1. **Exact intent-key match** — `category:slugified-text` looked up
   directly (`ArtRepository.findByIntentKey`). O(1)-ish, cheapest path.
2. **Fuzzy / token-overlap match** — `lib/matching/fuzzy.ts` compares
   the query against every cached record's `user_intent_keywords` for
   the same style, using:
   - exact normalized match
   - token overlap (shared-word ratio ≥ 0.75)
   - Levenshtein similarity (≥ `FUZZY_MATCH_THRESHOLD`, default 0.8)
   - a **negation guard**: phrases where one side has a negation word
     ("hate", "not", "never"...) and the other doesn't are never
     matched, regardless of edit-distance closeness — this is what
     stops "I love you" from matching "I hate you".
3. **Semantic matching (optional, disabled by default)** — see below.
4. **AI generation** — only reached if steps 1–3 all miss. Output is
   validated against `AiArtOutputSchema` (Zod) and run through
   `lib/moderation/check.ts` before being cached.
5. **Graceful fallback** — if AI generation fails or the response is
   invalid: try a featured cached template for the requested style,
   then fall back to a deterministic local template
   (`✨ [USER_TEXT] ✨`) as the last resort. The user always gets a
   result.

## Semantic matching (design, not yet wired up)

Deliberately **not** implemented with a vector database for MVP, per
the spec's "avoid unnecessary infrastructure" constraint. The intended
architecture when `SEMANTIC_CACHE_ENABLED=true`:

```
GitHub JSON records
  -> build a local embedding index in memory (batch job / on read-cache refresh)
  -> embed the incoming query
  -> cosine similarity against the index
  -> only accept a match above SEMANTIC_CACHE_THRESHOLD (default 0.88)
  -> ambiguous scores (near the threshold) are treated as a miss, not a hit
```

This should live in `lib/matching/semantic.ts` (not yet created) and be
called from `CacheAgent.resolve()` between steps 2 and 4 once
implemented.

## Cache key vs. intent key

- **Intent key** (`lib/cache/cache-key.ts` → `buildIntentKey`):
  `category:slugified-text`, used for the exact-match lookup.
- **Cache key** (`buildCacheKey`): a fuller key incorporating style,
  language, mode, and palette — intended for future layers (e.g. a
  Redis front cache) that need to disambiguate more dimensions than the
  intent key does. Never build a cache key from raw user text alone.

## Why writes go through the queue, not directly

`CacheAgent` calls `ArtRepository.create()` after a successful AI
generation. In the GitHub-backed implementation, `create()` **enqueues**
the mutation (`lib/github/write-queue.ts`) rather than committing
immediately — see `docs/database.md` for the single-writer batching
rationale.
