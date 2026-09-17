/**
 * Safe fuzzy matching. Two phrases are only considered the "same intent"
 * when they clear BOTH a string-similarity threshold AND make semantic
 * sense together — e.g. "i love you" / "i luv you" should match, but
 * "i love you" / "i hate you" must NOT, even though they're
 * Levenshtein-close. We guard against that with a cheap negation/opposite
 * check before trusting pure edit-distance similarity.
 */
import { normalizeForMatching } from "../unicode";

const NEGATION_WORDS = new Set(["not", "hate", "no", "never", "dislike", "stop", "without"]);

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1, // deletion
        dp[j - 1] + 1, // insertion
        prev + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
      prev = temp;
    }
  }
  return dp[n];
}

/** 0..1 similarity, 1 = identical. */
export function levenshteinSimilarity(a: string, b: string): number {
  const na = normalizeForMatching(a);
  const nb = normalizeForMatching(b);
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length, 1);
  return 1 - dist / maxLen;
}

export function tokenOverlap(a: string, b: string): number {
  const ta = new Set(normalizeForMatching(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeForMatching(b).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / Math.max(ta.size, tb.size);
}

/** Guards against matching semantic opposites just because they're edit-distance close. */
function containsConflictingNegation(a: string, b: string): boolean {
  const wa = new Set(normalizeForMatching(a).split(" "));
  const wb = new Set(normalizeForMatching(b).split(" "));
  const aHasNegation = [...wa].some((w) => NEGATION_WORDS.has(w));
  const bHasNegation = [...wb].some((w) => NEGATION_WORDS.has(w));
  return aHasNegation !== bHasNegation;
}

export interface FuzzyMatchResult {
  isMatch: boolean;
  similarity: number;
  method: "exact" | "token" | "levenshtein" | "none";
}

export function fuzzyMatch(query: string, candidate: string, threshold = 0.86): FuzzyMatchResult {
  const nq = normalizeForMatching(query);
  const nc = normalizeForMatching(candidate);

  if (nq === nc) return { isMatch: true, similarity: 1, method: "exact" };

  if (containsConflictingNegation(nq, nc)) {
    return { isMatch: false, similarity: 0, method: "none" };
  }

  const overlap = tokenOverlap(nq, nc);
  if (overlap >= 0.75) return { isMatch: true, similarity: overlap, method: "token" };

  const sim = levenshteinSimilarity(nq, nc);
  if (sim >= threshold) return { isMatch: true, similarity: sim, method: "levenshtein" };

  return { isMatch: false, similarity: Math.max(overlap, sim), method: "none" };
}
