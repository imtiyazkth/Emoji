# Deployment

## Recommended: Vercel

1. Push this repo to GitHub.
2. Import into Vercel.
3. Set environment variables (see `.env.example`) in the Vercel project
   settings — at minimum `ADMIN_EMAIL`, `ADMIN_SECRET`, `SESSION_SECRET`
   for a working admin login. Add `GROQ_API_KEY` and
   `GITHUB_TOKEN`/`GITHUB_OWNER`/`GITHUB_REPO`/`GITHUB_BRANCH` to enable
   real AI generation and persistent GitHub-backed caching (without
   them, the app runs on `MockProvider` + local JSON files, which is
   fine for a demo but resets on every deploy).
4. Deploy. `.github/workflows/deploy.yml` shows a CI-driven deploy using
   `vercel deploy --prod` if you'd rather not use Vercel's git
   integration directly — set `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
   `VERCEL_PROJECT_ID` as GitHub Actions secrets to enable it.

## Alternative: Docker / any Node host

```dockerfile
# Minimal example — not included in the repo by default to avoid
# unnecessary DevOps surface area for MVP, but this is all it takes:
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Works anywhere that runs a standard Node.js process reading a `PORT`
env var — Fly.io, Render, a plain VM, etc.

## GitHub JSON store setup (production)

1. Create (or designate) a **separate** GitHub repo to hold the JSON
   data (recommended, so app-code deploys and data commits don't mix
   history) — or reuse this repo's `data/` folder if you prefer a
   single repo.
2. Generate a fine-grained GitHub personal access token scoped to
   **Contents: read and write** on that repo only.
3. Set `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`.
4. Run `npm run test:github-write` locally once to confirm the
   token/repo/branch combination round-trips correctly before relying
   on it in production.

## Groq setup

1. Create a Groq API key at console.groq.com.
2. Set `GROQ_API_KEY` and `GROQ_MODEL` (e.g. `llama-3.1-8b-instant`).
3. Without a key, the app automatically uses `MockProvider` — useful for
   demos, CI, and contributors who don't want to provision a key.

## What CI validates before every merge (`.github/workflows/ci.yml`)

install → lint → typecheck → `validate:json` → unit/integration tests →
build. The build step deliberately runs with **no** Groq/GitHub secrets
present, to guarantee the app builds and starts even before those
integrations are configured.
