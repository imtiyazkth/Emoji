# Cache Agent

`lib/cache/agent.ts` implements the request flow for turning a phrase
into emoji/text art. **Policy: AI-first.** Every request calls Groq
first; the cached GitHub-JSON database is a fallback, used only when
the AI provider is unavailable — not a cost-saving first step. (This
intentionally reverses an earlier "never call AI if cache can satisfy"
design; the product decision is now that every user gets a fresh,
original AI composition whenever possible, with the cache purely as a
resilience layer for outages/rate-limits.)

## Flow

1. **Call the AI provider** (`lib/ai/provider.ts` — Groq, or `MockProvider`
   if no `GROQ_API_KEY` is set). The system prompt asks for an original
   composition using the `[USER_TEXT]` placeholder — see the prompt
   itself in `lib/ai/provider.ts` for the full creative brief (style
   library, size modes, quality checklist).
2. **Validate** the AI's JSON output against `AiArtOutputSchema` (Zod).
3. **Moderate** the generated art (`lib/moderation/check.ts`). A
   moderation failure here is a *non-retryable* error and is surfaced
   directly — it is never silently replaced by a cached fallback.
4. **Cache it.** On success, the new record is queued into the
   GitHub-backed store (`ArtRepository.create()` → the batched write
   queue in `lib/github/write-queue.ts`) so it becomes part of the
   fallback pool for future requests.
5. **If step 1 fails** (timeout, rate-limited, provider error — any
   *retryable* `AppError`), fall back to the cached database in this
   order:
   - exact intent-key match (`ArtRepository.findByIntentKey`)
   - fuzzy/token-overlap match (`lib/matching/fuzzy.ts`) against cached
     records' keywords for the same style
   - a featured cached template for the requested style
   - a deterministic local template (`✨ [USER_TEXT] ✨`) — this always
     succeeds, so the user never sees a hard failure.

## Fuzzy matching details

`lib/matching/fuzzy.ts` combines:

- exact normalized match
- token overlap (containment coefficient — shared words ÷ the smaller
  token set, so a short query fully contained in a longer candidate
  scores near 1.0)
- Levenshtein similarity (≥ `FUZZY_MATCH_THRESHOLD`, default 0.8)
- a **negation guard**: phrases where one side has a negation word
  ("hate", "not", "never"...) and the other doesn't are never matched,
  regardless of edit-distance closeness — this is what stops
  "I love you" from matching "I hate you".

## Semantic matching (design, not yet wired up)

Deliberately **not** implemented with a vector database for MVP.
Intended architecture when `SEMANTIC_CACHE_ENABLED=true`:

```
GitHub JSON records
  -> build a local embedding index in memory (batch job / on read-cache refresh)
  -> embed the incoming query
  -> cosine similarity against the index
  -> only accept a match above SEMANTIC_CACHE_THRESHOLD (default 0.88)
  -> ambiguous scores (near the threshold) are treated as a miss, not a hit
```

This should live in `lib/matching/semantic.ts` (not yet created) and
slot into the fallback chain in `CacheAgent.resolve()` between the
fuzzy match and the featured-template steps once implemented.

## Cache key vs. intent key

- **Intent key** (`lib/cache/cache-key.ts` → `buildIntentKey`):
  `category:slugified-text`, used for the exact-match fallback lookup.
- **Cache key** (`buildCacheKey`): a fuller key incorporating style,
  language, mode, and palette — intended for future layers (e.g. a
  Redis front cache) that need to disambiguate more dimensions than the
  intent key does. Never build a cache key from raw user text alone.

## Duplicate prevention

Before writing a fresh AI generation to the cache, `CacheAgent.resolve()`
computes a SHA-256 hash of the normalized `art` text + style
(`lib/utils/content-hash.ts` → `contentHashFor`) and checks
`ArtRepository.findByContentHash()`. If Groq happens to regenerate
something byte-for-byte identical to an existing record (common once
the cache has some depth), the existing record's hit count is
incremented instead of writing a near-duplicate entry — keeping the
GitHub-JSON database from growing unboundedly with copies of the same
pattern.

## Prompt versioning

`lib/ai/provider.ts` exports `PROMPT_VERSION` (currently
`"art_director_v2"`), stored on every AI-generated record as
`prompt_version`. Bump this string whenever `SYSTEM_PROMPT`'s creative
rules materially change, so a future investigation into "why does this
old cached record look different from what the AI makes now" can trace
back to exactly which prompt produced it.

## Cost note

Because every request now calls Groq, `RATE_LIMIT_GENERATE_PER_MIN`
(`.env.example`, default 6/min) is your main cost control — tune it
based on your Groq plan's rate limits and budget. If cost becomes a
concern later, the old cache-first order can be restored by swapping
the try/fallback order in `CacheAgent.resolve()`.
