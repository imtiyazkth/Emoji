/**
 * Minimal PWA service worker: network-first for navigation/API requests
 * (this app is fundamentally AI-driven — stale content is worse than an
 * honest "you're offline" state), with a small cached app-shell so the
 * site still opens to *something* usable when offline.
 *
 * NOT tested in a real browser (no browser in the authoring sandbox).
 * Verify: DevTools → Application → Service Workers shows "activated",
 * then Network tab → set to "Offline" → reload → the app shell should
 * still render instead of a browser error page. See docs/pwa.md.
 */

const CACHE_NAME = "emojiforge-shell-v1";
const APP_SHELL = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept API calls — they must always hit the network (or
  // fail visibly) so /api/generate's own error handling can do its job.
  if (request.url.includes("/api/")) return;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
