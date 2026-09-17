import { NextResponse } from "next/server";
import { lookupKaomoji, searchKaomoji, randomKaomoji, listAllKaomoji } from "@/lib/matching/kaomoji-lookup";
import { errorResponseBody, statusFor, newRequestId } from "@/lib/utils/errors";
import { checkRateLimit, clientIdFromRequest } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const requestId = newRequestId();
  try {
    checkRateLimit("public", clientIdFromRequest(req), Number(process.env.RATE_LIMIT_PUBLIC_PER_MIN || 60));

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "list";
    const query = searchParams.get("q") ?? "";
    const category = searchParams.get("category") ?? undefined;

    if (mode === "lookup") {
      const result = lookupKaomoji(query);
      return NextResponse.json({ success: true, result, requestId });
    }
    if (mode === "random") {
      const result = randomKaomoji(category);
      return NextResponse.json({ success: true, result, requestId });
    }
    if (mode === "search") {
      return NextResponse.json({ success: true, results: searchKaomoji(query), requestId });
    }
    return NextResponse.json({ success: true, results: listAllKaomoji(), requestId });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}
