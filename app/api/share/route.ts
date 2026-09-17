import { NextResponse } from "next/server";
import { z } from "zod";
import { buildWhatsAppShareUrl, buildTelegramShareUrl } from "@/lib/utils/share-links";
import { errorResponseBody, statusFor, newRequestId, AppError, ErrorCode } from "@/lib/utils/errors";
import featureFlags from "@/data/feature_flags.json";

export const runtime = "nodejs";

const ShareRequestSchema = z.object({
  text: z.string().min(1).max(500),
  channel: z.enum(["whatsapp", "telegram", "clipboard"]),
  pageUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  const requestId = newRequestId();
  try {
    const body = await req.json().catch(() => null);
    const parsed = ShareRequestSchema.safeParse(body);
    if (!parsed.success) throw new AppError(ErrorCode.VALIDATION_ERROR, "Invalid share request", { status: 400 });

    const { text, channel, pageUrl } = parsed.data;

    if (channel === "whatsapp" && !featureFlags.whatsapp_share) {
      throw new AppError(ErrorCode.FORBIDDEN, "WhatsApp sharing is currently disabled", { status: 403 });
    }
    if (channel === "telegram" && !featureFlags.telegram_share) {
      throw new AppError(ErrorCode.FORBIDDEN, "Telegram sharing is currently disabled", { status: 403 });
    }

    let url: string | null = null;
    if (channel === "whatsapp") url = buildWhatsAppShareUrl(text);
    if (channel === "telegram") url = buildTelegramShareUrl(pageUrl ?? "https://emojiforge.ai", text);

    return NextResponse.json({ success: true, requestId, url, channel });
  } catch (err) {
    return NextResponse.json(errorResponseBody(err, requestId), { status: statusFor(err) });
  }
}
