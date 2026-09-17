# Architecture

## Decision: single Next.js app, not a separate backend

EmojiForge AI uses **Next.js App Router with API routes** as both frontend
and backend, rather than a separate Express service. Rationale:

- The workload (short-lived request/response for generation, kaomoji
  lookup, mosaic metadata) doesn't need a long-running server process
  distinct from the web app.
- One deployable unit is simpler to operate for an MVP team than two.
- Next.js API routes run on Node.js runtime here (not Edge), because
  the GitHub write queue needs in-memory state across requests within
  a process and Node's `crypto`/`Buffer` APIs are used directly.
- If a piece of this later needs independent scaling (e.g. the AI
  generation path under heavy load), it can be split into its own
  service later — the `lib/` layer has no framework dependency baked in,
  it's plain TypeScript modules callable from any Node runtime.

## Request flow (text → emoji art)

```
Browser
  -> POST /api/generate (GenerateRequestSchema validated)
  -> CacheAgent.resolve()
       -> normalize input (lib/unicode)
       -> exact intent-key match (ArtRepository.findByIntentKey)
       -> fuzzy/token-overlap match (ArtRepository.findSimilar)
       -> [semantic match layer — see docs/cache-agent.md, disabled by default]
       -> AI generation (lib/ai/provider.ts, Groq or Mock)
            -> validate AI JSON output (Zod)
            -> moderation check
            -> ArtRepository.create() -> enqueued, NOT written directly
       -> fallback chain: cache -> featured template -> deterministic template
  -> standardized JSON response ({ success, art, source, requestId })
```

## Layered storage abstraction

```
UI / API routes
  -> ArtRepository interface (lib/cache/art-repository.ts)
       -> GitHubArtRepository (lib/github/art-repository.ts)   <- current impl
       -> [FutureDatabaseRepository]                            <- swap-in later
```

No component or route imports GitHub/filesystem specifics directly —
everything depends on `ArtRepository`. See `docs/database.md` for the
migration path.

## AI provider abstraction

```
lib/ai/provider.ts
  interface AIProvider { generateEmojiArt(input): Promise<GenerateResult> }
  - GroqProvider   (real Groq API call, used when GROQ_API_KEY is set)
  - MockProvider   (deterministic offline templates, default fallback)
  getAiProvider()  picks the right one at call time
```

## Directory map

- `app/` — pages + API routes (Next.js App Router)
- `components/` — React components, grouped by feature
- `lib/` — framework-agnostic business logic (AI, cache, GitHub, matching,
  moderation, security, unicode, image, utils)
- `data/` — the GitHub-JSON-backed content store (also the local dev
  fallback store)
- `scripts/` — one-off maintenance scripts (seed, validate, GitHub write test)
- `tests/` — unit/integration/api/e2e tests
- `docs/` — this documentation set
