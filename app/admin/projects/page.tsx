"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";

interface Project {
  id: string;
  name: string;
  shortDescription: string;
  status: string;
  website: string;
  github: string;
  featured: boolean;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/admin/projects", { credentials: "include" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      if (res.status === 401 || res.status === 403) return router.push("/admin/login");
      setError(json.error?.message ?? "Failed to load projects");
      return;
    }
    setProjects(json.projects);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, patch: Partial<Project>) {
    setError(null);
    const res = await fetch("/api/admin/projects", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error?.message ?? "Update failed");
      return;
    }
    await load();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-xl font-bold">Projects</h1>
      <AdminNav active="/admin/projects" />
      <p className="text-xs text-text-secondary">
        Edits write directly to <code>data/projects.json</code> (via GitHub, or the local file in dev) — changes
        appear on <code>/projects</code> within about a minute, no redeploy needed.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <ul className="flex flex-col gap-3">
        {projects.map((p) => (
          <li key={p.id} className="glass-card rounded-card flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{p.name}</span>
              <span className="text-xs text-text-secondary">{p.status}</span>
            </div>
            <p className="text-sm text-text-secondary">{p.shortDescription}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => patch(p.id, { featured: !p.featured })}
                className="rounded-full border border-border px-3 py-1"
              >
                {p.featured ? "Unfeature" : "Feature"}
              </button>
              <button
                onClick={() => patch(p.id, { status: p.status === "Live" ? "Hidden" : "Live" })}
                className={`rounded-full border px-3 py-1 ${
                  p.status === "Live" ? "border-danger/50 text-danger" : "border-success/50 text-success"
                }`}
              >
                {p.status === "Live" ? "Hide" : "Publish"}
              </button>
            </div>
          </li>
        ))}
        {projects.length === 0 && !error && <li className="text-sm text-text-secondary">No projects yet.</li>}
      </ul>
    </div>
  );
}
