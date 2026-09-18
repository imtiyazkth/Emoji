"use client";

import { useEffect, useRef, useState } from "react";

interface Layer {
  id: string;
  type: "text";
  content: string;
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
}

const CANVAS_SIZE = 512;

export function StickerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<Layer[]>([
    { id: "l1", type: "text", content: "😂", x: 256, y: 256, fontSize: 160, rotation: 0 },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>("l1");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    for (const layer of layers) {
      ctx.save();
      ctx.translate(layer.x, layer.y);
      ctx.rotate((layer.rotation * Math.PI) / 180);
      ctx.font = `${layer.fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layer.content, 0, 0);
      ctx.restore();
    }
  }, [layers]);

  function updateSelected(patch: Partial<Layer>) {
    setLayers((prev) => prev.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));
  }

  function addTextLayer() {
    const id = `l${Date.now()}`;
    setLayers((prev) => [...prev, { id, type: "text", content: "Text", x: 256, y: 256, fontSize: 48, rotation: 0 }]);
    setSelectedId(id);
  }

  function deleteSelected() {
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "sticker.png";
    a.click();
  }

  const selected = layers.find((l) => l.id === selectedId);

  return (
    <div className="flex flex-col gap-5">
      <div
        className="mx-auto rounded-card border border-border"
        style={{
          width: "min(90vw, 320px)",
          height: "min(90vw, 320px)",
          backgroundImage:
            "linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)",
          backgroundSize: "20px 20px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="h-full w-full"
          aria-label="Sticker canvas, 512 by 512 pixels"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={addTextLayer} className="flex-1 rounded-full border border-border px-4 py-2 text-sm">
          + Add text/emoji
        </button>
        <button
          onClick={deleteSelected}
          disabled={!selected}
          className="rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Delete
        </button>
      </div>

      {selected && (
        <div className="glass-card rounded-card flex flex-col gap-3 p-4">
          <label className="text-sm text-text-secondary">
            Content
            <input
              value={selected.content}
              onChange={(e) => updateSelected({ content: e.target.value })}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-base"
            />
          </label>
          <label className="text-sm text-text-secondary">
            Size ({selected.fontSize}px)
            <input
              type="range"
              min={16}
              max={220}
              value={selected.fontSize}
              onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })}
              className="mt-1 w-full"
            />
          </label>
          <label className="text-sm text-text-secondary">
            Rotation ({selected.rotation}°)
            <input
              type="range"
              min={-180}
              max={180}
              value={selected.rotation}
              onChange={(e) => updateSelected({ rotation: Number(e.target.value) })}
              className="mt-1 w-full"
            />
          </label>
        </div>
      )}

      <button onClick={exportPng} className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white">
        Export PNG
      </button>
      <p className="text-xs text-text-secondary">
        Sticker packs export as PNG/WebP assets for you to share via your device&apos;s share sheet or attach in
        chat apps. Direct one-tap install into WhatsApp/Telegram isn&apos;t an officially supported browser
        capability, so we don&apos;t claim it — see docs/api.md for the supported sharing paths.
      </p>
    </div>
  );
}
