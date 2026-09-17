import { describe, it, expect } from "vitest";
import { emojiForBrightness, getPalette, PALETTES } from "@/lib/image/palettes";

describe("emojiForBrightness", () => {
  const palette = getPalette("classic");

  it("returns the darkest emoji for brightness 0", () => {
    expect(emojiForBrightness(palette, 0)).toBe(palette.emojis[0]);
  });

  it("returns the lightest emoji for brightness near 255", () => {
    expect(emojiForBrightness(palette, 255)).toBe(palette.emojis[palette.emojis.length - 1]);
  });

  it("never returns undefined across the full brightness range", () => {
    for (let b = 0; b <= 255; b += 5) {
      expect(emojiForBrightness(palette, b)).toBeTruthy();
    }
  });
});

describe("getPalette", () => {
  it("falls back to the first palette for an unknown id", () => {
    expect(getPalette("does-not-exist")).toBe(PALETTES[0]);
  });
});
