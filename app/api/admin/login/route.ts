import { NextResponse } from "next/server";
import { verifyCredentials, createAdminSessionCookie } from "@/lib/security/admin-auth";
import { errorResponseBody, statusFor, newRequestId, AppError, ErrorCode } from "@/lib/utils/errors";
import { checkRateLimit, clientIdFromRequest } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const requestId = newRequestId();
  try {
    // Aggressive limit: this endpoint is a brute-force target.
    checkRateLimit("admin-login", clientIdFromRequest(req), 5);

    const body = await req.json().catch(() => null);
    const email = body?.email;
    const secret = body?.secret;
    if (typeof email !== "string" || typeof secret !== "string") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Email and secret are required", { status: 400 });
    }
    if (!verifyCredentials(email, secret)) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid credentials", { status: 401 });
    }
    const res = NextResponse.json({ success: true, requestId });
    res.headers.set("Set-Cookie", createAdminSessionCookie(email));
    return res;
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}
