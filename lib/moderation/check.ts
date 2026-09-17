/**
 * Lightweight keyword-based content safety gate. This is intentionally
 * simple for MVP — it blocks the most obvious abuse categories before
 * anything reaches the AI provider or the cache. It is NOT a substitute
 * for a real moderation API; swap in one (e.g. an LLM moderation
 * endpoint) at the TODO below when volume justifies it.
 */
import { AppError, ErrorCode } from "../utils/errors";

const BLOCKED_PATTERNS: RegExp[] = [
  /\b(kill|murder)\s+(you|him|her|them)\b/i,
  /\bchild\s*(sexual|porn|abuse)\b/i,
  /\bhow\s+to\s+make\s+a\s+bomb\b/i,
];

export function assertSafeInput(text: string): void {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      throw new AppError(ErrorCode.MODERATION_BLOCKED, "This request can't be processed.", { status: 422 });
    }
  }
  // TODO(migration): route to a real moderation model/API once traffic justifies the cost.
}

export function maxInputLength(): number {
  return 120;
}
