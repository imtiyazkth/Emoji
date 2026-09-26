"use client";

import { useEffect, useState } from "react";
import {
  type Creation,
  listCreations,
  searchCreations,
  toggleFavorite,
  deleteCreation,
  duplicateCreation,
} from "@/lib/memory/creations";

type Filter = "all" | "favorites" | Creation["mode"];

export function MemoryLibrary() {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [unsupported, setUnsupported] = useState(false);

  async function load() {
    try {
      const results = query.trim() ? await searchCreations(query) : await listCreations();
      setCreations(results);
    } catch {
      setUnsupported(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const visible = creations.filter((c) => {
    if (filter === "all") return true;
    if (filter === "favorites") return c.favorite;
    return c.mode === filter;
  });

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  async function handleFavorite(id: string) {
    await toggleFavorite(id);
    await load();
  }

  async function handleDelete(id: string) {
    await deleteCreation(id);
    await load();
  }

  async function handleDuplicate(id: string) {
    await duplicateCreation(id);
    await load();
  }

  if (unsupported) {
    return (
      <p className="text-sm text-text-secondary">
        Your Memory library isn&apos;t available in this browser (private/incognito mode often blocks it). Your
        creations still work — they just won&apos;t be saved here for reuse.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your creations…"
        className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary"
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter creations">
        {(
          [
            ["all", "All"],
            ["favorites", "Favorites"],
            ["text-to-art", "Emoji Art"],
            ["kaomoji", "Kaomoji"],
            ["mosaic", "Mosaics"],
            ["sticker", "Stickers"],
          ] as [Filter, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              filter === id ? "border-primary bg-primary/20 text-primary" : "border-border text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-text-secondary">Loading…</p>}

      {!loading && visible.length === 0 && (
        <div className="glass-card rounded-card flex flex-col items-center gap-2 p-8 text-center">
          <p className="text-lg font-semibold">Your creative memory is empty.</p>
          <p className="text-sm text-text-secondary">
            Create something and it will appear here, ready to reuse whenever you need it.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((c) => (
          <li key={c.id} className="glass-card rounded-card flex flex-col gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{c.title}</p>
                <p className="text-xs text-text-secondary">
                  {c.mode}
                  {c.style ? ` · ${c.style}` : ""} · {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleFavorite(c.id)}
                aria-label={c.favorite ? "Remove from favorites" : "Add to favorites"}
                className={`text-lg ${c.favorite ? "text-warning" : "text-text-secondary"}`}
              >
                {c.favorite ? "★" : "☆"}
              </button>
            </div>
            <pre className="art-preview rounded-xl bg-surface p-3 text-sm">{c.generatedOutput}</pre>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => copy(c.generatedOutput)} className="rounded-full border border-border px-3 py-1 text-xs">
                Copy
              </button>
              <button onClick={() => handleDuplicate(c.id)} className="rounded-full border border-border px-3 py-1 text-xs">
                Duplicate
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="rounded-full border border-danger/50 px-3 py-1 text-xs text-danger"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
