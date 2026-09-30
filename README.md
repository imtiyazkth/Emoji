# EmojiForge AI

A hybrid AI emoji art / kaomoji / photo-mosaic / sticker platform, built
mobile-first with a GitHub-JSON-backed cache agent that minimizes AI API
calls.

## Features (MVP scope)

- ✅ Text → AI Emoji Art (Groq, with automatic offline `MockProvider` fallback)
- ✅ Emoji → Kaomoji (pure local dictionary lookup, no AI call)
- ✅ Photo → Emoji Mosaic (entirely client-side canvas processing)
- ✅ Sticker Studio — styled text (fonts/colors/outline/shadow/background), emoji, and AI/Memory emoji-art layers, with drag-to-move + on-canvas resize/rotate handles; saves to My Memory and exports PNG
- ✅ Copy / Download / WhatsApp & Telegram share links
- ✅ GitHub-JSON data store with single-writer batched write queue
- ✅ Cache Agent: AI-first, with cache → featured → deterministic template as fallback if Groq is unavailable
- ✅ Admin CMS (login, analytics dashboard, pattern moderation)
- ✅ Responsive, accessible, PWA-ready UI
- ✅ Security basics (CSP headers, rate limiting, signed admin sessions, input validation)
- ✅ Unit + integration tests
- ✅ My Memory — local-first (IndexedDB) creation library; reuse saved creations instantly with zero AI calls (currently wired into Text → Emoji Art only — see `docs/memory.md`)
- ✅ Projects portfolio (`/projects`, owner-editable from `/admin/projects` — no redeploy needed)
- ✅ AdSense-ready `AdSlot` architecture (inert by default until a real publisher ID + ad network script is added — see `components/ads/AdSlot.tsx`)
- ✅ Cookie/consent banner — gates analytics tracking behind explicit opt-in (`lib/consent/`)
- ✅ Analytics event abstraction (`lib/analytics/provider.ts`) — consent-gated, no-op by default (no third-party service wired up; swap in a real provider when one is configured)
- ✅ Duplicate-prevention content hashing + prompt versioning for the AI cache (see `docs/cache-agent.md`)
- ✅ Contact page (`/contact`)
- ✅ PWA offline shell (service worker + offline banner — see `docs/pwa.md` for untested caveats)

See `docs/` for architecture, database, security, API, deployment,
admin, and memory-system details.

## Architecture

Single Next.js 14 App Router application (frontend + API routes) — see
`docs/architecture.md` for the full rationale and request-flow diagram.
Core principle: **every request calls the AI provider first for a
fresh, original composition; the cache is a resilience fallback for
when Groq is unavailable** — see `docs/cache-agent.md`.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in what you have; everything
                              # works with zero secrets via local
                              # fallback storage + MockProvider
npm run dev
```

Visit `http://localhost:3000`.

### Environment variables

See `.env.example` for the full list. Nothing is required to run
locally:

- No `GROQ_API_KEY` → AI generation uses `MockProvider` (deterministic
  offline templates).
- No `GITHUB_TOKEN`/`GITHUB_OWNER`/`GITHUB_REPO` → the app reads/writes
  `data/*.json` on local disk instead of GitHub.
- `ADMIN_EMAIL`/`ADMIN_SECRET`/`SESSION_SECRET` are needed only to sign
  into `/admin`.

## Development

```bash
npm run dev          # start dev server
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm test               # vitest (unit + integration)
npm run validate:json  # validate data/*.json against Zod schemas
npm run build           # production build
npm run seed             # reset data/emoji_art_db.json to baseline seed data
```

## Testing

`tests/unit/` covers Unicode handling, fuzzy matching, cache-key
generation, and mosaic palette logic. `tests/integration/` covers the
kaomoji dictionary lookup and admin session signing/verification.
`tests/api/` and `tests/e2e/` are scaffolded for route-level and
Playwright end-to-end coverage as the app grows — see "Known
limitations" below for current status.

## Deployment

See `docs/deployment.md`. Short version: deploy to Vercel (or any
Node host / Docker), set env vars, done.

## Admin setup

See `docs/admin.md`. Short version: set `ADMIN_EMAIL` / `ADMIN_SECRET` /
`SESSION_SECRET`, visit `/admin/login`.

## GitHub JSON database setup

See `docs/database.md` for the full design (single-writer write queue,
optimistic concurrency, migration triggers) and `docs/deployment.md`
for the production setup steps.

## Groq setup

Set `GROQ_API_KEY` (and optionally `GROQ_MODEL`, default
`openai/gpt-oss-20b`). The key is read server-side only
(`lib/ai/provider.ts`) and is never sent to the browser.

## Security

See `docs/security.md`: secrets handling, admin auth, security headers,
input validation, rate limiting, moderation, and image-upload
safeguards — plus an explicit list of what's intentionally deferred
past MVP (CSRF tokens on admin routes, a real moderation model, full
audit logging).

## Known limitations

- **Not build-validated in this environment.** This repository was
  authored in a sandboxed environment with no network access, so
  `npm install` / `npm run build` / `npm test` have **not** been run
  here. Run the full loop locally before deploying:
  `npm install && npm run lint && npm run typecheck && npm test && npm run build`.
- **Semantic matching** is designed (`docs/cache-agent.md`) but not
  implemented — `SEMANTIC_CACHE_ENABLED` is a no-op today.
- **Sticker Studio** supports styled text (fonts, colors, outline,
  shadow, background pill, alignment), emoji, and emoji art layers —
  drag to move, and the two on-canvas handles resize/rotate the
  selected layer. Saves to My Memory and exports PNG. Not yet built:
  uploading your own image as a layer, and multi-sticker pack export
  (bundling several stickers together).
- **Audit logging** for admin actions is not yet wired up (see
  `docs/security.md`).
- **i18n** architecture is prepared (`language` flows through the
  generate API and cache keys) but no locale switcher UI exists yet.
- **CSRF tokens** are not yet added to admin mutation routes (mitigated
  today by `SameSite=Strict` cookies only).
- App icons in `public/icons/` are placeholders — replace before
  production deploy.
- `tests/api/` and `tests/e2e/` directories are scaffolded but empty;
  the existing unit/integration suite covers the logic that doesn't
  require a running server or browser.
- **My Memory** (`lib/memory/`, `/memory`) has never run in a real
  browser (no browser in the authoring sandbox) — verify it end-to-end
  before relying on it; see `docs/memory.md`'s limitations section for
  the exact checks and for what's not yet built (regenerate action,
  export/import UI, auto-save from the other three tools).

## Still deferred from the full product spec

Most of the larger product spec is now built (see the feature list
above). These pieces are intentionally still NOT done, to avoid shipping
half-working versions of complex systems:

- **Apple-style motion/interaction doctrine** — spring physics,
  gesture-driven sheets, interruptible animations, and a materials/glass
  hierarchy. The current UI is a plain, functional Tailwind
  implementation with simple press feedback only.
- **Admin CMS beyond Projects and pattern moderation** — categories,
  feature flags, site metadata, ad frequency config and About-page
  content are still edited by hand in the relevant `data/*.json` file
  followed by a redeploy.
- **Real analytics provider and real ad network** — the consent banner,
  `trackEvent()` abstraction and `AdSlot` are all in place, but
  `trackEvent()` is a no-op and `AdSlot` renders nothing until a real
  provider / publisher ID is added.
- **Not browser-tested**: My Memory (IndexedDB), the service worker /
  offline banner, and the cookie banner have never run in a real
  browser (none was available while authoring). Follow the
  verification steps in `docs/memory.md` and `docs/pwa.md` after
  deploying.
- **Memory auto-save for Kaomoji / Mosaic tools** — Text → Emoji Art
  and Sticker Studio both save to My Memory now; Kaomoji and Mosaic
  still don't.
- **Real PWA icons** — `public/icons/` only contains a placeholder note.

## Migration strategy

GitHub JSON → Redis + PostgreSQL → object storage → real queue → vector
index, triggered by the conditions in `docs/database.md`. The
`ArtRepository` interface (`lib/cache/art-repository.ts`) means this
never requires rewriting UI or route code — only a new repository
implementation.

## Troubleshooting

- **"AI generation is temporarily busy" errors locally** — you likely
  don't have `GROQ_API_KEY` set; this is expected to fall back to
  `MockProvider` automatically. If you do have a key set and still see
  this, check Groq's rate limits for your account.
- **GitHub writes failing** — run `npm run test:github-write` to
  diagnose token/repo/branch/permission issues independently of the
  app.
- **Local data not updating** — the read path caches for 30s
  (`READ_CACHE_TTL_MS` in `lib/github/art-repository.ts`); writes are
  also batched (`GITHUB_BATCH_INTERVAL_MS`, default 5 minutes) — for
  faster local iteration, lower that env var or call
  `flushArtWritesNow()` from a script.
