"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Analytics {
  totals: { records: number; cacheHits: number; bySource: Record<string, number> };
  topPatterns: { id: string; category: string; style: string; hit_count: number }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/analytics", { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          if (res.status === 401 || res.status === 403) {
            router.push("/admin/login");
            return;
          }
          throw new Error(json.error?.message ?? "Failed to load analytics");
        }
        setData(json);
      })
      .catch((err) => setError(err.message));
  }, [router]);

  const aiGenerated = data?.totals.bySource["groq_ai_generated"] ?? 0;
  const totalRequests = (data?.totals.cacheHits ?? 0) + aiGenerated;
  const cacheHitRate = totalRequests > 0 ? ((data!.totals.cacheHits / totalRequests) * 100).toFixed(1) : "0.0";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>
      {error && <p className="text-sm text-danger">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Patterns" value={data.totals.records} />
            <StatCard label="Cache Hits" value={data.totals.cacheHits} />
            <StatCard label="Cache Hit Rate" value={`${cacheHitRate}%`} />
            <StatCard label="AI Calls Saved" value={data.totals.cacheHits} />
          </div>

          <section className="glass-card rounded-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-secondary">Top Patterns</h2>
            <ul className="flex flex-col divide-y divide-border">
              {data.topPatterns.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    {p.category} / {p.style}
                  </span>
                  <span className="text-text-secondary">{p.hit_count} hits</span>
                </li>
              ))}
              {data.topPatterns.length === 0 && (
                <li className="py-2 text-sm text-text-secondary">No hits recorded yet.</li>
              )}
            </ul>
          </section>

          <section className="glass-card rounded-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-secondary">Records by Source</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {Object.entries(data.totals.bySource).map(([source, count]) => (
                <li key={source} className="flex justify-between">
                  <span>{source}</span>
                  <span className="text-text-secondary">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-card rounded-card p-4">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
