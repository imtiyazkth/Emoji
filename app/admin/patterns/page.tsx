"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Pattern {
  id: string;
  category: string;
  style: string;
  status: string;
  featured: boolean;
  raw_text_art: string;
  hit_count: number;
}

export default function AdminPatternsPage() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/admin/patterns", { credentials: "include" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      if (res.status === 401 || res.status === 403) return router.push("/admin/login");
      setError(json.error?.message ?? "Failed to load patterns");
      return;
    }
    setPatterns(json.patterns);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, patch: Partial<Pattern>) {
    await fetch("/api/admin/patterns", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch }),
    });
    await load();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-bold">Pattern Moderation</h1>
      {error && <p className="text-sm text-danger">{error}</p>}
      <ul className="flex flex-col gap-3">
        {patterns.map((p) => (
          <li key={p.id} className="glass-card rounded-card flex flex-col gap-2 p-4">
            <pre className="art-preview text-sm">{p.raw_text_art}</pre>
            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
              <span>{p.category}</span>
              <span>·</span>
              <span>{p.style}</span>
              <span>·</span>
              <span>{p.status}</span>
              <span>·</span>
              <span>{p.hit_count} hits</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => patch(p.id, { status: "active" })}
                className="rounded-full border border-success/50 px-3 py-1 text-xs text-success"
              >
                Approve
              </button>
              <button
                onClick={() => patch(p.id, { status: "hidden" })}
                className="rounded-full border border-danger/50 px-3 py-1 text-xs text-danger"
              >
                Hide
              </button>
              <button
                onClick={() => patch(p.id, { featured: !p.featured })}
                className="rounded-full border border-border px-3 py-1 text-xs"
              >
                {p.featured ? "Unfeature" : "Feature"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
