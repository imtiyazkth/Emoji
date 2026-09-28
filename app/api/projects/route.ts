import { NextResponse } from "next/server";
import { readConfigFile } from "@/lib/github/config-store";
import { errorResponseBody, statusFor, newRequestId } from "@/lib/utils/errors";

export const runtime = "nodejs";

interface ProjectsFile {
  database_version: string;
  projects: unknown[];
}

const CACHE_TTL_MS = 60_000;
let cache: { data: ProjectsFile; expiresAt: number } | null = null;

/**
 * Serves the owner-editable project portfolio. Reads through
 * lib/github/config-store.ts (not a static import) so that admin edits
 * made via PATCH /api/admin/projects show up here without a redeploy —
 * a short in-memory cache avoids hitting the GitHub API on every page
 * view.
 */
export async function GET() {
  const requestId = newRequestId();
  try {
    if (!cache || cache.expiresAt < Date.now()) {
      const data = await readConfigFile<ProjectsFile>("projects.json");
      cache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    }
    return NextResponse.json({ success: true, ...cache.data, requestId });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}
