# Security

## Secrets

- `GROQ_API_KEY` and `GITHUB_TOKEN` are read only in server-side modules
  (`lib/ai/provider.ts`, `lib/github/client.ts`) and are never sent to
  the browser — no `NEXT_PUBLIC_` prefix, never embedded in client
  components.
- `.env` is gitignored; only `.env.example` (placeholders) is committed.

## Admin authentication

- `lib/security/admin-auth.ts` implements a signed, `HttpOnly`,
  `Secure`, `SameSite=Strict` session cookie, checked against
  `ADMIN_EMAIL`/`ADMIN_SECRET` server-side.
- **The client never sets a trusted role flag.** Every admin API route
  calls `requireAdmin(req)`, which verifies the HMAC signature
  server-side before honoring the request.
- Designed as a drop-in-replaceable boundary: swap `requireAdmin()` for
  Auth.js/Clerk/Supabase Auth/enterprise SSO later without touching
  route logic elsewhere.
- Login endpoint (`/api/admin/login`) is rate-limited more aggressively
  (5/min) than other endpoints, since it's a brute-force target.

## Headers (next.config.mjs)

`X-Content-Type-Options`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy`
restricting script/style/connect sources to `'self'` are set on every
response.

## Input validation

- Every API route validates its body/query with Zod
  (`lib/utils/schemas.ts`) before doing anything else.
- `lib/moderation/check.ts` blocks the most obvious abuse patterns
  before text reaches the AI provider or the cache (see its TODO for
  swapping in a real moderation API at scale).
- `lib/unicode.ts`'s `renderPlaceholders()` only substitutes a
  whitelisted set of bracketed tokens (`[USER_TEXT]`, `[NAME]`,
  `[EMOJI]`, `[CUSTOM_TEXT]`) and sanitizes substituted values
  (control-character stripping, angle-bracket stripping, length cap) —
  this is template-injection and XSS protection, not generic string
  interpolation.

## Rate limiting

`lib/security/rate-limit.ts` — in-memory sliding-window limiter, with
separate budgets per bucket:

- `RATE_LIMIT_GENERATE_PER_MIN` (default 6) — the AI-touching path
- `RATE_LIMIT_PUBLIC_PER_MIN` (default 60) — cache-only reads
- Admin login — hardcoded to 5/min regardless of env config

This is per-process; for multi-instance deployments swap for a shared
store (Redis/Upstash) — see `docs/deployment.md`.

## Image upload safety (mosaic tool)

`lib/image/mosaic.ts`:

- MIME allowlist (`image/jpeg`, `image/png`, `image/webp`) enforced
  client-side before decode.
- File size cap (`MAX_FILE_SIZE_BYTES`, 15MB).
- Images are downscaled to `MAX_PROCESSING_DIMENSION` (800px longest
  side) before pixel sampling, and the sampling grid is hard-capped at
  `MAX_GRID_CELLS` regardless of user-requested resolution — prevents a
  huge image or an extreme grid setting from freezing the tab.
- All processing is client-side; images are never uploaded to the
  server for the mosaic feature.

## What's deliberately NOT implemented yet (documented, not hidden)

- CSRF tokens on state-changing admin routes — the `SameSite=Strict`
  cookie mitigates the common case, but an explicit CSRF token should be
  added before handling anything beyond the current MVP admin actions.
- A real content-moderation model — `lib/moderation/check.ts` is
  keyword-based; swap in a proper moderation endpoint before scaling
  public traffic.
- Audit logging is scoped in the spec (section 50) but not yet wired to
  every admin mutation — currently only pattern approve/reject/feature
  go through `PATCH /api/admin/patterns`. Extend
  `lib/security/admin-auth.ts` callers to also write an audit record
  before production launch.
