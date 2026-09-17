/**
 * Unicode engineering utilities.
 *
 * `string.length` in JS counts UTF-16 code units, NOT visual characters.
 * Emoji sequences (ZWJ families, flags, skin-tone modifiers, variation
 * selectors) are one grapheme but multiple code units. Anything that
 * needs to reason about "how many characters" MUST use graphemeSplit(),
 * never .length or a naive for..of in performance-sensitive paths
 * (for..of IS codepoint-aware but still splits ZWJ sequences apart —
 * Intl.Segmenter is required for true grapheme clusters).
 */

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter("en", { granularity: "grapheme" })
    : null;

/** Split text into visual grapheme clusters (emoji-sequence safe). */
export function graphemeSplit(input: string): string[] {
  if (segmenter) {
    return Array.from(segmenter.segment(input), (s) => s.segment);
  }
  // Fallback: codepoint-aware split (loses ZWJ-sequence grouping, but
  // never splits a surrogate pair in half).
  return Array.from(input);
}

/** Visual character count — use this instead of `.length` for user text. */
export function visualLength(input: string): number {
  return graphemeSplit(input).length;
}

/**
 * Normalize user input for cache-key / intent matching.
 * Preserves meaningful Unicode (emoji, combining marks, scripts) —
 * only folds case, trims, collapses whitespace and repeated punctuation.
 */
export function normalizeForMatching(input: string): string {
  return input
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/([!?.,])\1{1,}/g, "$1"); // "!!!" -> "!"
}

/** Slugify normalized text into an intent-key fragment, e.g. "i love you" -> "i-love-you". */
export function slugifyIntent(input: string): string {
  return normalizeForMatching(input)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

const ALLOWED_PLACEHOLDERS = new Set(["USER_TEXT", "NAME", "EMOJI", "CUSTOM_TEXT"]);

/**
 * Safely render a template containing bracketed placeholders like
 * [USER_TEXT]. This is NOT generic string interpolation — only the
 * whitelisted placeholder tokens above are substituted; anything else
 * (e.g. attempted template/HTML/script injection) is left literal or
 * stripped, and values are never treated as further template source
 * (no recursive substitution, no HTML/markup emitted).
 */
export function renderPlaceholders(template: string, values: Partial<Record<string, string>>): string {
  return template.replace(/\[([A-Z_]+)\]/g, (whole, key: string) => {
    if (!ALLOWED_PLACEHOLDERS.has(key)) return whole; // unknown token: leave as literal text
    const raw = values[key];
    if (raw === undefined) return "";
    // Strip control chars and cap length; never allow markup-looking output.
    return sanitizePlaceholderValue(raw);
  });
}

function sanitizePlaceholderValue(value: string): string {
  const noControlChars = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  const noTags = noControlChars.replace(/[<>]/g, "");
  return noTags.slice(0, 200).normalize("NFC");
}
