# API Reference

All responses follow one of two shapes:

```json
{ "success": true, "...": "..." , "requestId": "req_..." }
```
```json
{
  "success": false,
  "error": { "code": "AI_RATE_LIMITED", "message": "...", "retryable": true },
  "requestId": "req_..."
}
```

Error codes: `VALIDATION_ERROR`, `RATE_LIMITED`, `AI_RATE_LIMITED`,
`AI_TIMEOUT`, `AI_PROVIDER_ERROR`, `CACHE_ERROR`, `GITHUB_READ_ERROR`,
`GITHUB_WRITE_ERROR`, `IMAGE_TOO_LARGE`, `INVALID_IMAGE`,
`MODERATION_BLOCKED`, `UNAUTHORIZED`, `FORBIDDEN`, `INTERNAL_ERROR`.

## `POST /api/generate`

Generate (or fetch cached) emoji art for a phrase.

```json
// Request
{ "text": "I Love You", "style": "bunny", "category": "love", "language": "en" }

// Response
{ "success": true, "source": "cache", "matchMethod": "exact", "art": "...", "category": "love", "style": "bunny", "requestId": "req_..." }
```

`source` is `"cache" | "ai" | "fallback"`. Rate limited per
`RATE_LIMIT_GENERATE_PER_MIN`.

## `GET /api/kaomoji?mode=lookup|search|random&q=...&category=...`

Local dictionary lookup — never calls the AI provider.

- `mode=lookup&q=😂` — exact emoji or alias match
- `mode=search&q=cool` — substring/category search
- `mode=random[&category=happy]` — random pick

## `GET /api/categories`, `GET /api/templates`

Return the current `data/categories.json` / `data/templates.json`
contents.

## `POST /api/share`

Builds a share URL for a supported channel.

```json
{ "text": "...", "channel": "whatsapp", "pageUrl": "https://..." }
```

`channel` is `"whatsapp" | "telegram" | "clipboard"`. WhatsApp/Telegram
respect `data/feature_flags.json`.

**Sharing limitations (documented, not faked):** browsers cannot
directly install a sticker pack into WhatsApp or Telegram without those
apps' own officially supported integration paths. This API only builds
the documented `wa.me` / `t.me` text-share URLs and leaves
image/sticker sharing to the platform's native Web Share API or a plain
download — see `components/sticker/StickerStudio.tsx` for the exact
fallback copy shown to users.

## `POST /api/admin/login`

```json
{ "email": "admin@example.com", "secret": "..." }
```

Sets the signed `efai_admin_session` cookie on success. Rate limited to
5/min regardless of config (brute-force protection).

## `GET /api/admin/analytics` *(requires admin session)*

Returns totals, records-by-source, and top patterns by hit count.

## `GET /api/admin/patterns` / `PATCH /api/admin/patterns` *(requires admin session)*

List all patterns, or update one:

```json
{ "id": "art_001", "patch": { "status": "active", "featured": true } }
```

Updates are enqueued through the GitHub write queue, not committed
immediately — see `docs/database.md`.
