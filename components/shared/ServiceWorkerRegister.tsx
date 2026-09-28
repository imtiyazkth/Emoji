"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker (public/sw.js) on mount. Silent
 * no-op in unsupported browsers or if registration fails — this must
 * never block or break the app.
 *
 * NOT tested in a real browser (no browser available in the authoring
 * sandbox) — verify via DevTools → Application → Service Workers after
 * deploying, per docs/pwa.md.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Register after load so it never competes with initial page resources.
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failing (unsupported browser, blocked storage, etc.)
        // should never break the app — it's a progressive enhancement only.
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
