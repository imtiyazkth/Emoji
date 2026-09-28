import { createHash } from "crypto";
import { normalizeForMatching } from "../unicode";

/**
 * Deterministic hash of normalized art content, used to avoid caching
 * near-duplicate AI outputs for the same style (spec: "duplicate
 * prevention" — never store the same generated pattern twice under a
 * different id just because whitespace/case differs).
 *
 * Only the `art` text + `style` are hashed — not category/keywords —
 * since two records with the same rendered art in the same style are a
 * duplicate regardless of how they were categorized.
 */
export function contentHashFor(art: string, style: string): string {
  const normalized = normalizeForMatching(art) + "|" + normalizeForMatching(style);
  return createHash("sha256").update(normalized, "utf-8").digest("hex");
}
