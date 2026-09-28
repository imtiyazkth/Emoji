"use client";

import { useEffect, useState } from "react";

/**
 * Tells the user clearly when they're offline, per spec section 51/52:
 * "never make the interface appear broken just because [the network]
 * is unavailable." Local tools (Kaomoji, My Memory, previously
 * generated art) keep working offline; only AI generation needs the
 * network, and its own error handling already surfaces a clear message
 * when the /api/generate request fails.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 bg-warning/90 px-4 py-2 text-center text-xs font-medium text-black"
    >
      You&apos;re offline — My Memory and Kaomoji still work. AI generation needs a connection.
    </div>
  );
}
