import { describe, it, expect } from "vitest";
import { lookupKaomoji, randomKaomoji, searchKaomoji } from "@/lib/matching/kaomoji-lookup";

describe("kaomoji lookup (local, no AI call)", () => {
  it("finds a kaomoji set by exact emoji", () => {
    const result = lookupKaomoji("😂");
    expect(result?.kaomojis.length).toBeGreaterThan(0);
  });

  it("finds a kaomoji set by alias word", () => {
    const result = lookupKaomoji("funny");
    expect(result?.emoji).toBe("😂");
  });

  it("returns null for an unknown query", () => {
    expect(lookupKaomoji("xyzzy-not-real")).toBeNull();
  });

  it("random always returns a valid entry", () => {
    const r = randomKaomoji();
    expect(r.kaomoji.length).toBeGreaterThan(0);
  });

  it("search narrows by category or alias substring", () => {
    const results = searchKaomoji("happy");
    expect(results.every((e) => e.category === "happy" || e.aliases.some((a) => a.includes("happy")))).toBe(true);
  });
});
