import { emojiForBrightness, type EmojiPalette } from "./palettes";

/**
 * Client-side-only photo -> emoji mosaic pipeline. Runs entirely in the
 * browser via Canvas/ImageData — no image ever leaves the device unless
 * the user explicitly shares/downloads the result.
 *
 * Guardrails against pathological inputs (huge photos crashing the tab):
 * the image is downscaled to MAX_PROCESSING_DIMENSION before sampling,
 * and the grid is capped so we never allocate a runaway number of cells.
 */

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
export const MAX_PROCESSING_DIMENSION = 800; // px, longest side, before grid sampling
export const MAX_GRID_CELLS = 80 * 80; // hard ceiling regardless of requested resolution

export interface MosaicOptions {
  gridWidth: number;
  gridHeight: number;
  palette: EmojiPalette;
  monochrome?: boolean;
}

export function validateImageFile(file: File): void {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("INVALID_IMAGE");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
}

function clampGrid(width: number, height: number): { width: number; height: number } {
  let w = Math.max(4, Math.min(120, Math.round(width)));
  let h = Math.max(4, Math.min(120, Math.round(height)));
  while (w * h > MAX_GRID_CELLS) {
    w = Math.max(4, Math.round(w * 0.9));
    h = Math.max(4, Math.round(h * 0.9));
  }
  return { width: w, height: h };
}

/** Draws `file` into an offscreen canvas, downscaled, and returns ImageData. */
export async function decodeAndResize(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_PROCESSING_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("INTERNAL_ERROR");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

export function generateMosaic(imageData: ImageData, options: MosaicOptions): string[][] {
  const { width: gridW, height: gridH } = clampGrid(options.gridWidth, options.gridHeight);
  const { width: imgW, height: imgH, data } = imageData;
  const cellW = imgW / gridW;
  const cellH = imgH / gridH;

  const grid: string[][] = [];
  for (let gy = 0; gy < gridH; gy++) {
    const row: string[] = [];
    for (let gx = 0; gx < gridW; gx++) {
      let rSum = 0,
        gSum = 0,
        bSum = 0,
        count = 0;

      const xStart = Math.floor(gx * cellW);
      const xEnd = Math.floor((gx + 1) * cellW);
      const yStart = Math.floor(gy * cellH);
      const yEnd = Math.floor((gy + 1) * cellH);

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const idx = (y * imgW + x) * 4;
          rSum += data[idx]!;
          gSum += data[idx + 1]!;
          bSum += data[idx + 2]!;
          count++;
        }
      }
      count = Math.max(1, count);
      const r = rSum / count;
      const g = gSum / count;
      const b = bSum / count;
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b; // perceptual luma

      row.push(emojiForBrightness(options.palette, brightness));
    }
    grid.push(row);
  }
  return grid;
}

export function gridToText(grid: string[][]): string {
  return grid.map((row) => row.join("")).join("\n");
}
