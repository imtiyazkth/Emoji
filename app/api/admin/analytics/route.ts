import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-auth";
import { GitHubArtRepository } from "@/lib/github/art-repository";
import { errorResponseBody, statusFor, newRequestId } from "@/lib/utils/errors";

export const runtime = "nodejs";
const repo = new GitHubArtRepository();

/**
 * MVP analytics: derived directly from the art DB (hit counts, sources)
 * rather than a separate event store, keeping the GitHub-JSON footprint
 * small. Swap for a real analytics pipeline per docs/database.md
 * "migration triggers" once volume justifies it.
 */
export async function GET(req: Request) {
  const requestId = newRequestId();
  try {
    requireAdmin(req);
    const all = await repo.listAll();
    const totalHits = all.reduce((sum, a) => sum + a.hit_count, 0);
    const bySource = all.reduce<Record<string, number>>((acc, a) => {
      acc[a.source] = (acc[a.source] ?? 0) + 1;
      return acc;
    }, {});
    const topPatterns = [...all].sort((a, b) => b.hit_count - a.hit_count).slice(0, 10);

    return NextResponse.json({
      success: true,
      requestId,
      totals: { records: all.length, cacheHits: totalHits, bySource },
      topPatterns: topPatterns.map((p) => ({
        id: p.id,
        category: p.category,
        style: p.style,
        hit_count: p.hit_count,
      })),
    });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}
