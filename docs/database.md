# Database: GitHub JSON as the MVP data store

## Why GitHub JSON, and its limits

GitHub is the authoritative store for content that's read far more than
it's written (art patterns, kaomoji, categories, templates, feature
flags) and benefits from being human-reviewable, version-controlled,
and free to host. It is explicitly **not** treated as a transactional
database:

- **No direct per-request writes.** Every mutation goes through the
  single-writer batched queue (`lib/github/write-queue.ts`), which
  buffers mutations in memory and commits them in batches
  (`GITHUB_BATCH_INTERVAL_MS` / `GITHUB_MAX_BATCH_SIZE`).
- **Optimistic concurrency.** Every write includes the file's last-read
  SHA. A `409` conflict triggers refetch → re-apply → retry with
  exponential backoff, up to 3 attempts, after which the batch is moved
  to an in-memory dead-letter list for inspection rather than retried
  forever.
- **Schema validation before every commit.** `assertValidEmojiArtDb()`
  (Zod) runs immediately before serialization — malformed JSON is never
  committed.
- **Local filesystem fallback.** When `GITHUB_TOKEN`/`GITHUB_OWNER`/
  `GITHUB_REPO` aren't set, `lib/github/local-store.ts` reads/writes
  `data/*.json` on disk directly, so `npm run dev` works with zero
  external credentials.

## Migration triggers

Move off GitHub JSON when any of these become true:

| Trigger | Symptom |
|---|---|
| Database size | `emoji_art_db.json` exceeds a few MB / thousands of records — GitHub API payloads get slow |
| Write concurrency | Batch queue regularly hits `GITHUB_MAX_BATCH_SIZE` within one interval |
| GitHub API cost/limits | Sustained rate-limit (429) responses from GitHub |
| Analytics complexity | Dashboard queries need aggregation GitHub JSON can't do efficiently |
| Full-text/semantic search | Fuzzy matching in `lib/matching/fuzzy.ts` is no longer fast/accurate enough at scale |
| Multi-region | Need for state consistent across regions faster than GitHub's commit latency allows |

## Migration path

```
GitHub JSON (current)
  -> Redis (hot cache/rate limits) + PostgreSQL (durable records)
       -> Object storage (uploaded images / sticker assets)
            -> Real queue (SQS/Upstash) replacing the in-memory write queue
                 -> Vector index (pgvector / dedicated) for semantic matching
```

Because every read/write goes through the `ArtRepository` interface
(`lib/cache/art-repository.ts`), this migration means writing a new
`PostgresArtRepository` (or similar) implementing the same interface —
**no UI or route code needs to change.**

## Record schema

See `lib/utils/schemas.ts` (`EmojiArtRecordSchema`) for the authoritative
shape. Every record has an `intent_key` (exact-match key), a
`user_intent_keywords` array (fuzzy-match candidates), and a
`raw_text_art` field containing the whitelisted `[USER_TEXT]` placeholder
— never fully-interpolated user content, so a single cached record works
for any input phrase.
