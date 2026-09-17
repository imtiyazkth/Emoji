import { describe, it, expect } from "vitest";
import { fuzzyMatch, levenshteinSimilarity, tokenOverlap } from "@/lib/matching/fuzzy";

describe("fuzzyMatch", () => {
  it("matches minor spelling variants", () => {
    expect(fuzzyMatch("i love you", "i luv you").isMatch).toBe(true);
  });

  it("matches case-insensitive exact phrases", () => {
    expect(fuzzyMatch("I LOVE YOU", "i love you").isMatch).toBe(true);
  });

  it("matches a subset phrase via token overlap", () => {
    expect(fuzzyMatch("love you", "i love you so much").isMatch).toBe(true);
  });

  it("does NOT match semantic opposites despite edit-distance closeness", () => {
    expect(fuzzyMatch("i love you", "i hate you").isMatch).toBe(false);
  });

  it("does not match unrelated phrases", () => {
    expect(fuzzyMatch("good morning", "happy birthday").isMatch).toBe(false);
  });
});

describe("levenshteinSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(levenshteinSimilarity("test", "test")).toBe(1);
  });

  it("returns 0 similarity boundary correctly for empty vs non-empty", () => {
    expect(levenshteinSimilarity("", "abc")).toBeLessThan(1);
  });
});

describe("tokenOverlap", () => {
  it("returns 0 when no words are shared", () => {
    expect(tokenOverlap("cat dog", "sun moon")).toBe(0);
  });
});
