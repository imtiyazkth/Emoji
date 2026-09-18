"use client";

import { useState } from "react";
import { StickyActionBar } from "@/components/shared/StickyActionBar";

interface LookupResponse {
  success: boolean;
  result: { emoji: string; kaomojis: string[]; category: string } | null;
}
interface RandomResponse {
  success: boolean;
  result: { emoji: string; kaomoji: string; category: string };
}

export function KaomojiConverter() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<string[]>([]);
  const [notFound, setNotFound] = useState(false);

  async function handleConvert() {
    if (!query.trim()) return;
    setNotFound(false);
    const res = await fetch(`/api/kaomoji?mode=lookup&q=${encodeURIComponent(query.trim())}`);
    const data: LookupResponse = await res.json();
    if (data.result) {
      setMatches(data.result.kaomojis);
    } else {
      setMatches([]);
      setNotFound(true);
    }
  }

  async function handleRandom() {
    const res = await fetch("/api/kaomoji?mode=random");
    const data: RandomResponse = await res.json();
    setMatches([data.result.kaomoji]);
    setNotFound(false);
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="😂 or 'laugh'"
          className="flex-1 rounded-2xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && handleConvert()}
        />
        <button
          onClick={handleConvert}
          className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          Convert
        </button>
      </div>

      <button onClick={handleRandom} className="self-start text-sm text-secondary underline underline-offset-4">
        🎲 Surprise me
      </button>

      {notFound && (
        <p className="text-sm text-text-secondary">
          No kaomoji found for that yet — try an emoji like 😂 or a word like &quot;cool&quot;.
        </p>
      )}

      {matches.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="glass-card art-preview-container rounded-card p-4">
            {matches.map((m, i) => (
              <p key={i} className="art-preview py-1 text-lg">
                {m}
              </p>
            ))}
          </div>
          <StickyActionBar onCopy={() => copy(matches[0] ?? "")} onShare={() => copy(matches[0] ?? "")} />
        </div>
      )}
    </div>
  );
}
