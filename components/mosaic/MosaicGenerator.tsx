"use client";

import { useRef, useState } from "react";
import { PALETTES, getPalette } from "@/lib/image/palettes";
import { validateImageFile, decodeAndResize, generateMosaic, gridToText } from "@/lib/image/mosaic";
import { StickyActionBar } from "@/components/shared/StickyActionBar";

export function MosaicGenerator() {
  const [paletteId, setPaletteId] = useState("classic");
  const [gridWidth, setGridWidth] = useState(28);
  const [gridHeight, setGridHeight] = useState(28);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      validateImageFile(file);
      const imageData = await decodeAndResize(file);
      const grid = generateMosaic(imageData, { gridWidth, gridHeight, palette: getPalette(paletteId) });
      setOutput(gridToText(grid));
    } catch (err) {
      const code = err instanceof Error ? err.message : "INVALID_IMAGE";
      setError(
        code === "IMAGE_TOO_LARGE"
          ? "That image is too large — try one under 15MB."
          : "Couldn't read that image — try a JPG, PNG, or WebP."
      );
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (output) void navigator.clipboard.writeText(output);
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emoji-mosaic.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="mosaic-file" className="mb-2 block text-sm font-medium text-text-secondary">
          Upload a photo
        </label>
        <input
          id="mosaic-file"
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-white"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-text-secondary">Palette</span>
        <div className="flex flex-wrap gap-2">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPaletteId(p.id)}
              aria-pressed={paletteId === p.id}
              className={`rounded-full border px-3 py-1.5 text-sm ${
                paletteId === p.id ? "border-primary bg-primary/20 text-primary" : "border-border text-text-secondary"
              }`}
            >
              {p.emojis.slice(0, 3).join("")} {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm text-text-secondary">
          Grid width
          <input
            type="range"
            min={8}
            max={64}
            value={gridWidth}
            onChange={(e) => setGridWidth(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
        <label className="text-sm text-text-secondary">
          Grid height
          <input
            type="range"
            min={8}
            max={64}
            value={gridHeight}
            onChange={(e) => setGridHeight(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </label>
      </div>

      {busy && <p className="text-sm text-text-secondary">Sampling pixels…</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {output && (
        <div className="flex flex-col gap-3">
          <div className="glass-card art-preview-container rounded-card p-4">
            <pre className="art-preview text-sm leading-tight">{output}</pre>
          </div>
          <div className="flex gap-2">
            <button onClick={download} className="flex-1 rounded-full border border-border px-4 py-2 text-sm">
              Download TXT
            </button>
          </div>
          <StickyActionBar onCopy={copy} onShare={copy} />
        </div>
      )}
    </div>
  );
}
