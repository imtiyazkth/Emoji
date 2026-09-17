import { describe, it, expect } from "vitest";
import { visualLength, normalizeForMatching, slugifyIntent, renderPlaceholders } from "@/lib/unicode";

describe("visualLength", () => {
  it("counts a ZWJ family emoji as one grapheme, not many code units", () => {
    const family = "👨‍👩‍👧‍👦"; // multiple codepoints joined by ZWJ
    expect(visualLength(family)).toBe(1);
    expect(family.length).toBeGreaterThan(1); // proves .length would be wrong here
  });

  it("counts plain ASCII normally", () => {
    expect(visualLength("hello")).toBe(5);
  });
});

describe("normalizeForMatching", () => {
  it("folds case and collapses whitespace", () => {
    expect(normalizeForMatching("  I   LOVE you ")).toBe("i love you");
  });

  it("collapses repeated punctuation", () => {
    expect(normalizeForMatching("wow!!!")).toBe("wow!");
  });

  it("preserves emoji and non-Latin scripts", () => {
    expect(normalizeForMatching("愛してる 😍")).toBe("愛してる 😍");
  });
});

describe("slugifyIntent", () => {
  it("produces a URL/key-safe slug", () => {
    expect(slugifyIntent("I Love You!")).toBe("i-love-you");
  });
});

describe("renderPlaceholders", () => {
  it("substitutes whitelisted placeholders", () => {
    expect(renderPlaceholders("Hi [USER_TEXT]!", { USER_TEXT: "world" })).toBe("Hi world!");
  });

  it("leaves unknown bracketed tokens untouched", () => {
    expect(renderPlaceholders("Hi [SCRIPT_TAG]!", { USER_TEXT: "world" })).toBe("Hi [SCRIPT_TAG]!");
  });

  it("strips angle brackets from substituted values to prevent markup injection", () => {
    const result = renderPlaceholders("Hi [USER_TEXT]!", { USER_TEXT: "<script>alert(1)</script>" });
    expect(result).not.toContain("<script>");
  });

  it("caps substituted value length", () => {
    const long = "a".repeat(500);
    const result = renderPlaceholders("[USER_TEXT]", { USER_TEXT: long });
    expect(result.length).toBeLessThanOrEqual(200);
  });
});
