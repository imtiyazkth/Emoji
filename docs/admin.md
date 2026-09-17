# Admin

## Setup

1. Set `ADMIN_EMAIL`, `ADMIN_SECRET`, and `SESSION_SECRET` in your
   environment (see `.env.example`). There's no separate user database
   for MVP — a single admin identity is checked directly against these
   env vars.
2. Visit `/admin/login` and sign in.
3. On success, a signed `HttpOnly` session cookie is set for 8 hours.

## Pages

- `/admin/login` — sign-in form, posts to `/api/admin/login`.
- `/admin/dashboard` — cache hit rate, AI calls saved, records by
  source, top patterns by hit count (pulled from `/api/admin/analytics`).
- `/admin/patterns` — moderation queue: approve/hide/feature any cached
  art record (pulled from and patched via `/api/admin/patterns`).

## Extending

- Swap the auth mechanism: replace the implementation inside
  `lib/security/admin-auth.ts` (`verifyCredentials`,
  `createAdminSessionCookie`, `requireAdmin`) with Auth.js/Clerk/
  Supabase Auth/SSO — every admin route already calls `requireAdmin(req)`
  as its only authorization check, so nothing else needs to change.
- Add more admin sections (categories, templates, feature flags) by
  following the same pattern as `/admin/patterns`: a server-validated
  API route under `app/api/admin/*` guarded by `requireAdmin`, and a
  client page that fetches it with `credentials: "include"`.
- Wire audit logging: see the note in `docs/security.md` — currently
  pattern moderation isn't yet writing an audit trail entry per action.
