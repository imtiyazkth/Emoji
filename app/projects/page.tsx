import type { Metadata } from "next";
import { readConfigFile } from "@/lib/github/config-store";
import { ProjectCard, type Project } from "@/components/projects/ProjectCard";

export const metadata: Metadata = {
  title: "Projects | EmojiForge AI",
  description: "A portfolio of projects.",
};

export const revalidate = 60; // re-fetch from GitHub/local at most once a minute

interface ProjectsFile {
  database_version: string;
  projects: Project[];
}

export default async function ProjectsPage() {
  let allProjects: Project[] = [];
  try {
    const data = await readConfigFile<ProjectsFile>("projects.json");
    allProjects = data.projects;
  } catch {
    // Config unreachable (e.g. GitHub down) — show the empty state rather
    // than crashing the page; the admin page will surface the real error.
  }

  // Only "Live" projects are public; "Hidden" ones are admin-only until
  // republished (see /admin/projects).
  const projects = allProjects.filter((p) => p.status !== "Hidden");
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-24 pt-6">
      <div>
        <h1 className="text-xl font-bold">Projects</h1>
        <p className="mt-1 text-sm text-text-secondary">A few things built along the way.</p>
      </div>

      {projects.length === 0 && <p className="text-sm text-text-secondary">Projects will appear here.</p>}

      {featured.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {rest.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
