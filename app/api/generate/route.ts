import { NextResponse } from "next/server";
import { GenerateRequestSchema } from "@/lib/utils/schemas";
import { CacheAgent } from "@/lib/cache/agent";
import { errorResponseBody, statusFor, newRequestId, AppError, ErrorCode } from "@/lib/utils/errors";
import { checkRateLimit, clientIdFromRequest } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

const agent = new CacheAgent();

export async function POST(req: Request) {
  const requestId = newRequestId();
  try {
    checkRateLimit("generate", clientIdFromRequest(req), Number(process.env.RATE_LIMIT_GENERATE_PER_MIN || 6));

    const json = await req.json().catch(() => null);
    const parsed = GenerateRequestSchema.safeParse(json);
    if (!parsed.success) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid request body", { status: 400 });
    }

    const result = await agent.resolve(parsed.data);

    return NextResponse.json({
      success: true,
      source: result.source,
      matchMethod: result.matchMethod,
      art: result.art,
      category: result.category,
      style: result.style,
      requestId,
    });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}
