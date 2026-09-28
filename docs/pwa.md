# PWA / Offline Behavior

## What's implemented

- `public/manifest.json` — installable app metadata (name, icons, theme
  color, standalone display mode).
- `public/sw.js` — a minimal service worker: network-first for page
  requests (never for `/api/*` — those must always hit the network so
  `/api/generate`'s own error/fallback handling works correctly), with
  a small cached app-shell (`/`, `/manifest.json`) so the site opens to
  something usable when offline, instead of a browser error page.
- `components/shared/ServiceWorkerRegister.tsx` — registers the worker
  on mount, silently no-ops on unsupported browsers or registration
  failure.
- `components/shared/OfflineBanner.tsx` — a visible "you're offline"
  banner using the browser's `online`/`offline` events, explicitly
  telling the user which tools still work (My Memory, Kaomoji — both
  fully client-side) versus which need a connection (AI generation).

## What's deliberately NOT cached offline

- Generated art from `/api/generate` is not proactively cached for
  offline use — that's what **My Memory** (`lib/memory/`, IndexedDB) is
  for. A creation the user already saved to Memory is available offline
  by construction (it's a local database, not a network fetch); the
  service worker doesn't need to duplicate that.
- The Photo Mosaic and Sticker Studio tools are fully client-side
  (Canvas API) and work offline automatically — no special service
  worker handling needed for them.

## Known limitation — not tested in a real browser

This was authored in a sandboxed environment with no browser available,
so `public/sw.js` has never actually registered against a real
browser's Service Worker API. Before relying on this in production:

1. Deploy, then open the site in Chrome/Edge.
2. DevTools → Application → Service Workers — confirm it shows
   "activated and is running" for `sw.js`.
3. DevTools → Application → Cache Storage — confirm `emojiforge-shell-v1`
   exists and contains `/` and `/manifest.json`.
4. DevTools → Network tab → set throttling to "Offline" → reload the
   page — it should still render the app shell rather than showing
   "No internet connection."
5. Try generating art while offline — you should see the app's own
   error handling (not a browser network error), and the `OfflineBanner`
   should be visible at the top.
6. If any of these don't match, the most likely fix is in the
   `fetch` handler's cache-matching logic in `public/sw.js` — service
   worker caching bugs are notoriously easy to get subtly wrong without
   live testing, so treat step 4 especially as the real verification.

## App icons

`public/icons/` currently only has a placeholder README — real
`icon-192.png` and `icon-512.png` files need to be added before this
manifest is fully valid for installability on all platforms.
