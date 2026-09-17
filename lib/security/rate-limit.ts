import { AppError, ErrorCode } from "../utils/errors";

/**
 * Simple in-memory sliding-window rate limiter, keyed by (bucket, id)
 * where id is typically an IP or session id. Per-process only — fine for
 * MVP/single-instance deployments; swap for Redis/Upstash at scale
 * (see docs/deployment.md).
 */

const buckets = new Map<string, number[]>();

export function checkRateLimit(bucket: string, id: string, maxPerMinute: number): void {
  const key = `${bucket}:${id}`;
  const now = Date.now();
  const windowStart = now - 60_000;
  const timestamps = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= maxPerMinute) {
    throw new AppError(ErrorCode.RATE_LIMITED, "Too many requests. Please slow down.", {
      retryable: true,
      status: 429,
    });
  }
  timestamps.push(now);
  buckets.set(key, timestamps);
}

export function clientIdFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || "unknown";
}
