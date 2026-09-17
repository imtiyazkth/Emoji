import { describe, it, expect } from "vitest";
import { buildCacheKey, buildIntentKey } from "@/lib/cache/cache-key";

describe("buildCacheKey", () => {
  it("differentiates the same phrase across styles", () => {
    const love = buildCacheKey({ text: "I love you", style: "bunny", language: "en" });
    const dark = buildCacheKey({ text: "I love you", style: "dark", language: "en" });
    expect(love).not.toBe(dark);
  });

  it("is stable for equivalent normalized text", () => {
    const a = buildCacheKey({ text: "I Love You!!", style: "bunny", language: "en" });
    const b = buildCacheKey({ text: "i love you", style: "bunny", language: "en" });
    expect(a).toBe(b);
  });
});

describe("buildIntentKey", () => {
  it("combines category and slugified text", () => {
    expect(buildIntentKey("love", "I Love You")).toBe("love:i-love-you");
  });
});
