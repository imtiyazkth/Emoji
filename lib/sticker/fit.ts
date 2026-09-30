/**
 * Pure geometry/colour helpers for the sticker editor. No DOM access here,
 * so everything in this file is unit-tested (tests/unit/sticker-fit.test.ts).
 */

export const MIN_FONT = 8;
export const MAX_FONT = 480;

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Scale factor that makes a w×h box fit inside maxW×maxH (may be > 1). */
export function fitScale(w: number, h: number, maxW: number, maxH: number): number {
  if (w <= 0 || h <= 0) return 1;
  return Math.min(maxW / w, maxH / h);
}

export function fitFontSize(
  fontSize: number,
  w: number,
  h: number,
  maxW: number,
  maxH: number,
  min = MIN_FONT,
  max = MAX_FONT
): number {
  return Math.round(clamp(fontSize * fitScale(w, h, maxW, maxH), min, max));
}

export function snapToCenter(v: number, center: number, threshold: number): { value: number; snapped: boolean } {
  return Math.abs(v - center) <= threshold ? { value: center, snapped: true } : { value: v, snapped: false };
}

/** Convert a canvas-space point into a rotated layer's local space. */
export function toLocal(px: number, py: number, cx: number, cy: number, rotationDeg: number): { x: number; y: number } {
  const dx = px - cx;
  const dy = py - cy;
  const a = (-rotationDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

export function pointInBox(lx: number, ly: number, w: number, h: number): boolean {
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
}

/** Rotate a local offset (relative to a shape's centre) into canvas space. */
export function rotatePoint(lx: number, ly: number, rotationDeg: number): { x: number; y: number } {
  const a = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return { x: lx * cos - ly * sin, y: lx * sin + ly * cos };
}

/** "#rgb" / "#rrggbb" + alpha -> "rgba(r,g,b,a)". Non-hex input is returned unchanged. */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  let h = m[1]!;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(alpha, 0, 1)})`;
}
