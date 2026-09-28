"use client";

import { useEffect, useState } from "react";
import { hasDecided, acceptAll, acceptNecessaryOnly } from "@/lib/consent/consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only decide client-side, after mount, to avoid a hydration mismatch
    // (server has no localStorage to check).
    setVisible(!hasDecided());
  }, []);

  if (!visible) return null;

  function choose(action: () => void) {
    action();
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie and privacy choices"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/98 p-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-text-secondary">
          We use necessary cookies to run this site. Optional analytics/ads cookies are off unless you allow them —
          see our{" "}
          <a href="/privacy" className="underline underline-offset-4">
            Privacy page
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => choose(acceptNecessaryOnly)}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium"
          >
            Necessary only
          </button>
          <button
            onClick={() => choose(acceptAll)}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
