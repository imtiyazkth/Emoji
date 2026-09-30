import { describe, it, expect } from "vitest";
import { fitScale, fitFontSize, clamp, snapToCenter, toLocal, rotatePoint, pointInBox, hexToRgba } from "@/lib/sticker/fit";

describe("clamp", () => {
  it("clamps to range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("fitScale", () => {
  it("shrinks an oversized box to fit", () => {
    expect(fitScale(1000, 500, 500, 500)).toBeCloseTo(0.5);
  });

  it("returns 1 for degenerate input", () => {
    expect(fitScale(0, 100, 500, 500)).toBe(1);
  });
});

describe("fitFontSize", () => {
  it("shrinks font size proportionally and stays within min/max", () => {
    const result = fitFontSize(100, 1000, 100, 500, 500);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThanOrEqual(8);
  });

  it("never exceeds MAX_FONT even if scale > 1", () => {
    const result = fitFontSize(400, 10, 10, 500, 500, 8, 480);
    expect(result).toBeLessThanOrEqual(480);
  });
});

describe("snapToCenter", () => {
  it("snaps when within threshold", () => {
    expect(snapToCenter(254, 256, 6)).toEqual({ value: 256, snapped: true });
  });

  it("does not snap when outside threshold", () => {
    expect(snapToCenter(200, 256, 6)).toEqual({ value: 200, snapped: false });
  });
});

describe("toLocal", () => {
  it("returns the offset unchanged with zero rotation", () => {
    expect(toLocal(110, 100, 100, 100, 0)).toEqual({ x: 10, y: 0 });
  });

  it("rotates a point 90 degrees around the centre", () => {
    const { x, y } = toLocal(110, 100, 100, 100, 90);
    expect(x).toBeCloseTo(0, 5);
    expect(y).toBeCloseTo(-10, 5);
  });
});

describe("pointInBox", () => {
  it("is true for a point inside the box", () => {
    expect(pointInBox(10, 10, 50, 50)).toBe(true);
  });

  it("is false for a point outside the box", () => {
    expect(pointInBox(40, 10, 50, 50)).toBe(false);
  });
});

describe("hexToRgba", () => {
  it("converts a 6-digit hex to rgba", () => {
    expect(hexToRgba("#ff0000", 0.5)).toBe("rgba(255,0,0,0.5)");
  });

  it("expands a 3-digit hex", () => {
    expect(hexToRgba("#f00", 1)).toBe("rgba(255,0,0,1)");
  });

  it("passes through non-hex input unchanged", () => {
    expect(hexToRgba("red", 1)).toBe("red");
  });
});

describe("rotatePoint", () => {
  it("is the inverse of toLocal", () => {
    const local = toLocal(140, 90, 100, 100, 37);
    const back = rotatePoint(local.x, local.y, 37);
    expect(back.x).toBeCloseTo(40, 5);
    expect(back.y).toBeCloseTo(-10, 5);
  });

  it("rotates (0,-10) by 90deg to (10,0)", () => {
    const r = rotatePoint(0, -10, 90);
    expect(r.x).toBeCloseTo(10, 5);
    expect(r.y).toBeCloseTo(0, 5);
  });
});
