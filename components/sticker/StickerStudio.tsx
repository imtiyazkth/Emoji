"use client";

import { useEffect, useRef, useState } from "react";
import { CANVAS_SIZE, type Layer, type TextAlign } from "@/lib/sticker/types";
import { clamp, fitFontSize, MIN_FONT, MAX_FONT, toLocal, rotatePoint, pointInBox } from "@/lib/sticker/fit";
import { FONTS, fontFamilyFor, TEXT_STYLE_PRESETS, SWATCHES, EMOJI_PICKER } from "@/lib/sticker/presets";
import { saveCreation, listByMode, type Creation } from "@/lib/memory/creations";
import { trackEvent } from "@/lib/analytics/provider";

const HANDLE_RADIUS = 16;
const ROTATE_HANDLE_OFFSET = 34;

function newLayer(kind: Layer["kind"], content: string): Layer {
  return {
    id: `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    kind,
    content,
    x: CANVAS_SIZE / 2,
    y: CANVAS_SIZE / 2,
    fontSize: kind === "art" ? 28 : kind === "emoji" ? 140 : 56,
    rotation: 0,
    color: "#ffffff",
    fontId: "sans",
    bold: kind !== "art",
    italic: false,
    align: "center",
    outlineColor: "#000000",
    outlineWidth: kind === "text" ? 8 : 0,
    shadow: false,
    shadowColor: "#000000",
    shadowBlur: 10,
    shadowOffset: 3,
    bgColor: null,
    opacity: 1,
    flipX: false,
    visible: true,
  };
}

/** Measures a layer's rendered box (width/height in canvas px) without
 * mutating anything — used for hit-testing and for "fit to canvas". */
function measureLayer(ctx: CanvasRenderingContext2D, layer: Layer): { w: number; h: number; lineHeight: number } {
  const family = layer.kind === "art" ? "ui-monospace, 'Courier New', monospace" : fontFamilyFor(layer.fontId);
  const weight = layer.bold ? "700" : "400";
  const style = layer.italic ? "italic" : "normal";
  ctx.font = `${style} ${weight} ${layer.fontSize}px ${family}`;
  const lines = layer.content.split("\n");
  const lineHeight = layer.fontSize * (layer.kind === "art" ? 1.15 : 1.25);
  let maxW = 0;
  for (const line of lines) maxW = Math.max(maxW, ctx.measureText(line).width);
  return { w: maxW, h: lineHeight * lines.length, lineHeight };
}

function drawLayer(ctx: CanvasRenderingContext2D, layer: Layer) {
  if (!layer.visible) return;
  const { w, h, lineHeight } = measureLayer(ctx, layer);

  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.translate(layer.x, layer.y);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  if (layer.flipX) ctx.scale(-1, 1);
  ctx.textAlign = layer.align === "left" ? "left" : layer.align === "right" ? "right" : "center";
  ctx.textBaseline = "middle";

  if (layer.bgColor) {
    const padX = layer.fontSize * 0.35;
    const padY = layer.fontSize * 0.22;
    const bw = w + padX * 2;
    const bh = h + padY * 2;
    const r = Math.min(18, bh / 2);
    ctx.fillStyle = layer.bgColor;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, r);
    ctx.fill();
  }

  if (layer.shadow) {
    ctx.shadowColor = layer.shadowColor;
    ctx.shadowBlur = layer.shadowBlur;
    ctx.shadowOffsetX = layer.shadowOffset;
    ctx.shadowOffsetY = layer.shadowOffset;
  }

  const lines = layer.content.split("\n");
  const startY = -((lines.length - 1) * lineHeight) / 2;
  const alignX = layer.align === "left" ? -w / 2 : layer.align === "right" ? w / 2 : 0;

  lines.forEach((line, i) => {
    const ly = startY + i * lineHeight;
    if (layer.outlineWidth > 0) {
      ctx.lineWidth = layer.outlineWidth;
      ctx.strokeStyle = layer.outlineColor;
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(line, alignX, ly);
    }
    ctx.fillStyle = layer.color;
    ctx.fillText(line, alignX, ly);
  });

  ctx.restore();
}

export function StickerStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<Layer[]>([newLayer("emoji", "😂")]);
  const [selectedId, setSelectedId] = useState<string | null>(layers[0]!.id);
  const [bgTransparent, setBgTransparent] = useState(true);
  const [bgColor, setBgColor] = useState("#1c1c2b");
  const [tab, setTab] = useState<"style" | "emoji" | "art">("style");
  const [savedNotice, setSavedNotice] = useState(false);

  const [artQuery, setArtQuery] = useState("");
  const [artStyle, setArtStyle] = useState("funny");
  const [artBusy, setArtBusy] = useState(false);
  const [artError, setArtError] = useState<string | null>(null);
  const [memoryArt, setMemoryArt] = useState<Creation[]>([]);

  const selected = layers.find((l) => l.id === selectedId) ?? null;

  // Load previously-generated text-art from My Memory for reuse (no AI call).
  useEffect(() => {
    if (tab !== "art") return;
    listByMode("text-to-art")
      .then(setMemoryArt)
      .catch(() => setMemoryArt([]));
  }, [tab]);

  // ---- render loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (!bgTransparent) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }
    for (const layer of layers) drawLayer(ctx, layer);

    if (selected?.visible) {
      const { w, h } = measureLayer(ctx, selected);
      const halfW = w / 2 + 10;
      const halfH = h / 2 + 10;
      ctx.save();
      ctx.translate(selected.x, selected.y);
      ctx.rotate((selected.rotation * Math.PI) / 180);
      ctx.strokeStyle = "rgba(168,85,247,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-halfW, -halfH, halfW * 2, halfH * 2);
      ctx.setLineDash([]);

      // resize handle (bottom-right)
      ctx.beginPath();
      ctx.fillStyle = "#a855f7";
      ctx.arc(halfW, halfH, 9, 0, Math.PI * 2);
      ctx.fill();

      // rotate handle (above top edge)
      ctx.beginPath();
      ctx.moveTo(0, -halfH);
      ctx.lineTo(0, -halfH - ROTATE_HANDLE_OFFSET);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "#22d3ee";
      ctx.arc(0, -halfH - ROTATE_HANDLE_OFFSET, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [layers, selected, bgTransparent, bgColor]);

  // ---- pointer interaction ----
  const drag = useRef<{
    mode: "move" | "resize" | "rotate";
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origFontSize: number;
    origRotation: number;
    centerDistAtStart: number;
  } | null>(null);

  function canvasPoint(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_SIZE / rect.width;
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const p = canvasPoint(e);

    if (selected?.visible) {
      const { w, h } = measureLayer(ctx, selected);
      const halfW = w / 2 + 10;
      const halfH = h / 2 + 10;

      const resizeHandle = rotatePoint(halfW, halfH, selected.rotation);
      const resizePos = { x: selected.x + resizeHandle.x, y: selected.y + resizeHandle.y };
      if (Math.hypot(p.x - resizePos.x, p.y - resizePos.y) <= HANDLE_RADIUS) {
        (canvas as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = {
          mode: "resize",
          id: selected.id,
          startX: p.x,
          startY: p.y,
          origX: selected.x,
          origY: selected.y,
          origFontSize: selected.fontSize,
          origRotation: selected.rotation,
          centerDistAtStart: Math.hypot(p.x - selected.x, p.y - selected.y) || 1,
        };
        return;
      }

      const rotateHandle = rotatePoint(0, -halfH - ROTATE_HANDLE_OFFSET, selected.rotation);
      const rotatePos = { x: selected.x + rotateHandle.x, y: selected.y + rotateHandle.y };
      if (Math.hypot(p.x - rotatePos.x, p.y - rotatePos.y) <= HANDLE_RADIUS) {
        (canvas as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = {
          mode: "rotate",
          id: selected.id,
          startX: p.x,
          startY: p.y,
          origX: selected.x,
          origY: selected.y,
          origFontSize: selected.fontSize,
          origRotation: selected.rotation,
          centerDistAtStart: 0,
        };
        return;
      }
    }

    // Hit-test layers top-to-bottom for a "move" drag / selection.
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]!;
      if (!layer.visible) continue;
      const { w, h } = measureLayer(ctx, layer);
      const local = toLocal(p.x, p.y, layer.x, layer.y, layer.rotation);
      if (pointInBox(local.x, local.y, w + 20, h + 20)) {
        setSelectedId(layer.id);
        (canvas as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = {
          mode: "move",
          id: layer.id,
          startX: p.x,
          startY: p.y,
          origX: layer.x,
          origY: layer.y,
          origFontSize: layer.fontSize,
          origRotation: layer.rotation,
          centerDistAtStart: 0,
        };
        return;
      }
    }
    setSelectedId(null);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const d = drag.current;
    if (!d) return;
    const p = canvasPoint(e);

    if (d.mode === "move") {
      const nx = clamp(d.origX + (p.x - d.startX), 0, CANVAS_SIZE);
      const ny = clamp(d.origY + (p.y - d.startY), 0, CANVAS_SIZE);
      setLayers((prev) => prev.map((l) => (l.id === d.id ? { ...l, x: nx, y: ny } : l)));
    } else if (d.mode === "resize") {
      const dist = Math.hypot(p.x - d.origX, p.y - d.origY) || 1;
      const scale = dist / d.centerDistAtStart;
      const next = Math.round(clamp(d.origFontSize * scale, MIN_FONT, MAX_FONT));
      setLayers((prev) => prev.map((l) => (l.id === d.id ? { ...l, fontSize: next } : l)));
    } else if (d.mode === "rotate") {
      const angle = (Math.atan2(p.y - d.origY, p.x - d.origX) * 180) / Math.PI + 90;
      setLayers((prev) => prev.map((l) => (l.id === d.id ? { ...l, rotation: Math.round(angle) } : l)));
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drag.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  }

  // ---- layer CRUD ----
  function updateSelected(patch: Partial<Layer>) {
    if (!selectedId) return;
    setLayers((prev) => prev.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));
  }

  function addLayer(kind: Layer["kind"], content: string) {
    const layer = newLayer(kind, content);
    setLayers((prev) => [...prev, layer]);
    setSelectedId(layer.id);
    setTab("style");
  }

  function applyPreset(presetId: string) {
    const preset = TEXT_STYLE_PRESETS.find((p) => p.id === presetId);
    if (preset) updateSelected(preset);
  }

  function fitToCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !selected) return;
    const { w, h } = measureLayer(ctx, selected);
    const next = fitFontSize(selected.fontSize, w, h, CANVAS_SIZE * 0.85, CANVAS_SIZE * 0.85);
    updateSelected({ fontSize: next, x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2, rotation: 0 });
  }

  function reorder(id: string, dir: -1 | 1) {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });
  }

  function deleteSelected() {
    if (!selectedId) return;
    setLayers((prev) => prev.filter((l) => l.id !== selectedId));
    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: Layer = { ...selected, id: `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, x: selected.x + 16, y: selected.y + 16 };
    setLayers((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }

  // ---- emoji art ----
  async function generateArt() {
    if (!artQuery.trim()) return;
    setArtBusy(true);
    setArtError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: artQuery.trim(), style: artStyle, language: "en" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error?.message ?? "Generation failed");
      addLayer("art", data.art);
      trackEvent("art_saved", { mode: "sticker-art" });
    } catch (err) {
      setArtError(err instanceof Error ? err.message : "Couldn't generate that — try again.");
    } finally {
      setArtBusy(false);
    }
  }

  // ---- export / save ----
  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wasSelected = selectedId;
    setSelectedId(null);
    // Selection outline is drawn in the render effect; wait a frame so the
    // exported PNG doesn't include the purple selection box.
    requestAnimationFrame(() => {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "sticker.png";
      a.click();
      trackEvent("sticker_created");
      setSelectedId(wasSelected);
    });
  }

  async function saveToMemory() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL("image/png");
      await saveCreation({
        title: layers.find((l) => l.kind !== "art")?.content.slice(0, 40) || "Sticker",
        originalInput: layers.map((l) => l.content).join(" · "),
        generatedOutput: dataUrl,
        mode: "sticker",
      });
      setSavedNotice(true);
      trackEvent("art_saved", { mode: "sticker" });
      setTimeout(() => setSavedNotice(false), 2500);
    } catch {
      // IndexedDB unavailable (private browsing, old browser) — export still works.
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="mx-auto touch-none rounded-card border border-border"
        style={{
          width: "min(90vw, 340px)",
          height: "min(90vw, 340px)",
          backgroundImage: bgTransparent
            ? "linear-gradient(45deg, #222 25%, transparent 25%), linear-gradient(-45deg, #222 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #222 75%), linear-gradient(-45deg, transparent 75%, #222 75%)"
            : undefined,
          backgroundSize: "20px 20px",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="h-full w-full touch-none"
          aria-label="Sticker canvas, 512 by 512 pixels. Drag a layer to move it, the cyan handle to rotate, the purple handle to resize."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <button onClick={() => addLayer("text", "New text")} className="rounded-full border border-border px-3 py-1.5">
          + Text
        </button>
        <button onClick={() => setTab("emoji")} className="rounded-full border border-border px-3 py-1.5">
          + Emoji
        </button>
        <button onClick={() => setTab("art")} className="rounded-full border border-border px-3 py-1.5">
          + Emoji Art
        </button>
        <button
          onClick={() => setBgTransparent((v) => !v)}
          className="rounded-full border border-border px-3 py-1.5"
        >
          {bgTransparent ? "🏁 Transparent" : "🎨 Solid"}
        </button>
        {!bgTransparent && (
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="h-7 w-7 rounded-full border border-border bg-transparent"
            aria-label="Background color"
          />
        )}
      </div>

      {layers.length > 0 && (
        <div className="glass-card rounded-card flex flex-col gap-1 p-2">
          {layers
            .slice()
            .reverse()
            .map((l) => (
              <div
                key={l.id}
                className={`flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-xs ${
                  l.id === selectedId ? "bg-primary/15 text-primary" : "text-text-secondary"
                }`}
              >
                <button onClick={() => setSelectedId(l.id)} className="flex-1 truncate text-left">
                  {l.kind === "art" ? "🎨 " : l.kind === "emoji" ? "" : "🔤 "}
                  {l.content.slice(0, 24) || "…"}
                </button>
                <button
                  onClick={() => updateSelected({ visible: !l.visible })}
                  onMouseDown={() => setSelectedId(l.id)}
                  className="px-1"
                  aria-label={l.visible ? "Hide layer" : "Show layer"}
                >
                  {l.visible ? "👁️" : "🚫"}
                </button>
                <button onClick={() => reorder(l.id, 1)} className="px-1" aria-label="Move layer up">
                  ↑
                </button>
                <button onClick={() => reorder(l.id, -1)} className="px-1" aria-label="Move layer down">
                  ↓
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={duplicateSelected} disabled={!selected} className="flex-1 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">
          Duplicate
        </button>
        <button onClick={fitToCanvas} disabled={!selected} className="flex-1 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40">
          Fit to canvas
        </button>
        <button onClick={deleteSelected} disabled={!selected} className="flex-1 rounded-full border border-danger/50 px-4 py-2 text-sm text-danger disabled:opacity-40">
          Delete
        </button>
      </div>

      <div className="flex gap-2 border-b border-border text-sm">
        {(["style", "emoji", "art"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 ${t === tab ? "border-primary text-primary" : "border-transparent text-text-secondary"}`}
          >
            {t === "style" ? "Style" : t === "emoji" ? "Emoji" : "Emoji Art"}
          </button>
        ))}
      </div>

      {tab === "style" && selected && (
        <div className="glass-card rounded-card flex flex-col gap-4 p-4">
          <label className="text-sm text-text-secondary">
            Content
            <textarea
              value={selected.content}
              onChange={(e) => updateSelected({ content: e.target.value })}
              rows={selected.kind === "art" ? 5 : 2}
              className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-base font-mono"
            />
          </label>

          {selected.kind !== "art" && (
            <div>
              <span className="mb-1.5 block text-sm text-text-secondary">Quick styles</span>
              <div className="flex flex-wrap gap-2">
                {TEXT_STYLE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className="rounded-full border border-border px-3 py-1 text-xs"
                    style={{ color: p.color, WebkitTextStroke: p.outlineWidth ? `1px ${p.outlineColor}` : undefined }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selected.kind !== "art" && (
            <div>
              <span className="mb-1.5 block text-sm text-text-secondary">Font</span>
              <div className="flex flex-wrap gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => updateSelected({ fontId: f.id })}
                    aria-pressed={selected.fontId === f.id}
                    style={{ fontFamily: f.family }}
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      selected.fontId === f.id ? "border-primary text-primary" : "border-border text-text-secondary"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <span className="mb-1.5 block text-sm text-text-secondary">Text color</span>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  onClick={() => updateSelected({ color: c })}
                  className="h-7 w-7 rounded-full border border-border"
                  style={{ backgroundColor: c }}
                  aria-label={`Set color ${c}`}
                />
              ))}
              <input
                type="color"
                value={selected.color}
                onChange={(e) => updateSelected({ color: e.target.value })}
                className="h-7 w-7 rounded-full border border-border bg-transparent"
                aria-label="Custom text color"
              />
            </div>
          </div>

          {selected.kind !== "art" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-sm text-text-secondary">
                  Outline width ({selected.outlineWidth}px)
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={selected.outlineWidth}
                    onChange={(e) => updateSelected({ outlineWidth: Number(e.target.value) })}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="text-sm text-text-secondary">
                  Outline color
                  <input
                    type="color"
                    value={selected.outlineColor}
                    onChange={(e) => updateSelected({ outlineColor: e.target.value })}
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-transparent"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={selected.bold} onChange={(e) => updateSelected({ bold: e.target.checked })} />
                  Bold
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={selected.italic} onChange={(e) => updateSelected({ italic: e.target.checked })} />
                  Italic
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={selected.shadow} onChange={(e) => updateSelected({ shadow: e.target.checked })} />
                  Shadow
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={selected.bgColor !== null}
                    onChange={(e) => updateSelected({ bgColor: e.target.checked ? "#a855f7" : null })}
                  />
                  Background pill
                </label>
              </div>

              {selected.bgColor !== null && (
                <label className="text-sm text-text-secondary">
                  Pill color
                  <input
                    type="color"
                    value={selected.bgColor}
                    onChange={(e) => updateSelected({ bgColor: e.target.value })}
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-transparent"
                  />
                </label>
              )}

              <div className="flex gap-2 text-xs">
                {(["left", "center", "right"] as TextAlign[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => updateSelected({ align: a })}
                    aria-pressed={selected.align === a}
                    className={`flex-1 rounded-full border px-3 py-1.5 ${
                      selected.align === a ? "border-primary text-primary" : "border-border text-text-secondary"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}

          <label className="text-sm text-text-secondary">
            Size ({selected.fontSize}px)
            <input
              type="range"
              min={8}
              max={480}
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
          <label className="text-sm text-text-secondary">
            Opacity ({Math.round(selected.opacity * 100)}%)
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={selected.opacity}
              onChange={(e) => updateSelected({ opacity: Number(e.target.value) })}
              className="mt-1 w-full"
            />
          </label>
          <label className="flex items-center gap-1.5 text-sm text-text-secondary">
            <input type="checkbox" checked={selected.flipX} onChange={(e) => updateSelected({ flipX: e.target.checked })} />
            Flip horizontal
          </label>
        </div>
      )}

      {tab === "emoji" && (
        <div className="glass-card rounded-card flex flex-col gap-4 p-4">
          {EMOJI_PICKER.map((group) => (
            <div key={group.category}>
              <span className="mb-1.5 block text-xs text-text-secondary">{group.category}</span>
              <div className="grid grid-cols-6 gap-2 text-2xl">
                {group.emojis.map((e) => (
                  <button
                    key={e}
                    onClick={() => addLayer("emoji", e)}
                    className="rounded-xl border border-border py-1.5 hover:border-primary/60"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "art" && (
        <div className="glass-card rounded-card flex flex-col gap-4 p-4">
          <div>
            <span className="mb-1.5 block text-sm text-text-secondary">Generate new emoji art</span>
            <div className="flex gap-2">
              <input
                value={artQuery}
                onChange={(e) => setArtQuery(e.target.value)}
                placeholder="e.g. good morning"
                className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm"
              />
              <select
                value={artStyle}
                onChange={(e) => setArtStyle(e.target.value)}
                className="rounded-xl border border-border bg-surface px-2 py-2 text-sm"
              >
                {["funny", "bunny", "cute", "minimal", "dark"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={generateArt}
                disabled={artBusy || !artQuery.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {artBusy ? "…" : "Add"}
              </button>
            </div>
            {artError && <p className="mt-1.5 text-xs text-danger">{artError}</p>}
          </div>

          {memoryArt.length > 0 && (
            <div>
              <span className="mb-1.5 block text-sm text-text-secondary">From My Memory (no AI call)</span>
              <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
                {memoryArt.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addLayer("art", c.generatedOutput)}
                    className="rounded-xl border border-border p-2 text-left"
                  >
                    <pre className="art-preview text-xs">{c.generatedOutput.slice(0, 120)}</pre>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={saveToMemory} className="flex-1 rounded-full border border-border px-4 py-3 text-sm font-semibold">
          Save to My Memory
        </button>
        <button onClick={exportPng} className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white">
          Export PNG
        </button>
      </div>
      {savedNotice && <p className="text-center text-xs text-success">Saved to My Memory ✓</p>}

      <p className="text-xs text-text-secondary">
        Sticker packs export as PNG assets for you to share via your device&apos;s share sheet or attach in chat
        apps. Direct one-tap install into WhatsApp/Telegram isn&apos;t an officially supported browser capability,
        so we don&apos;t claim it — see docs/api.md for the supported sharing paths.
      </p>
    </div>
  );
}
