import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-auth";
import { GitHubArtRepository } from "@/lib/github/art-repository";
import { errorResponseBody, statusFor, newRequestId, AppError, ErrorCode } from "@/lib/utils/errors";

export const runtime = "nodejs";
const repo = new GitHubArtRepository();

export async function GET(req: Request) {
  const requestId = newRequestId();
  try {
    requireAdmin(req);
    const all = await repo.listAll();
    return NextResponse.json({ success: true, requestId, patterns: all });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}

/** Approve, reject, feature, edit — all flow through the same queued update path. */
export async function PATCH(req: Request) {
  const requestId = newRequestId();
  try {
    requireAdmin(req);
    const body = await req.json().catch(() => null);
    if (!body?.id) throw new AppError(ErrorCode.VALIDATION_ERROR, "id is required", { status: 400 });
    const updated = await repo.update(body.id, body.patch ?? {});
    if (!updated) throw new AppError(ErrorCode.VALIDATION_ERROR, "Pattern not found", { status: 404 });
    return NextResponse.json({ success: true, requestId, pattern: updated });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}
