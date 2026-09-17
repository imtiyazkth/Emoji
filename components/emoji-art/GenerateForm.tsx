"use client";

import { useState } from "react";
import { StickyActionBar } from "@/components/shared/StickyActionBar";

const STYLES = [
  { id: "bunny", label: "❤️ Love" },
  { id: "funny", label: "😂 Funny" },
  { id: "cute", label: "🐰 Cute" },
  { id: "birthday", label: "🎂 Birthday" },
  { id: "minimal", label: "▫️ Minimal" },
  { id: "dark", label: "🖤 Dark" },
  { id: "gaming", label: "🎮 Gaming" },
  { id: "cars", label: "🏎️ Cars" },
];

interface GenerateResponse {
  success: boolean;
  art?: string;
  source?: string;
  error?: { message: string };
}

export function GenerateForm() {
  const [text, setText] = useState("");
  const [style, setStyle] = useState("bunny");
  const [art, setArt] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("Understanding your text…");

  async function handleGenerate() {
    if (!text.trim()) return;
    setStatus("loading");
    setErrorMsg(null);
    setLoadingLabel("Understanding your text…");
    const t1 = setTimeout(() => setLoadingLabel("Creating layout…"), 500);
    const t2 = setTimeout(() => setLoadingLabel("Polishing emoji spacing…"), 1100);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), style, language: "en" }),
      });
      const data: GenerateResponse = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message ?? "Generation failed");
      }
      setArt(data.art ?? null);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  }

  function handleCopy() {
    if (art) void navigator.clipboard.writeText(art);
  }

  function handleShare() {
    if (!art) return;
    const url = `https://wa.me/?text=${encodeURIComponent(art)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="art-input" className="mb-2 block text-sm font-medium text-text-secondary">
          Write something
        </label>
        <input
          id="art-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={120}
          placeholder="I Love You"
          className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium text-text-secondary">Style</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Art style">
          {STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStyle(s.id)}
              aria-pressed={style === s.id}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                style === s.id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border bg-surface text-text-secondary"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === "loading" || !text.trim()}
        className="w-full rounded-full bg-gradient-to-r from-primary to-secondary px-4 py-3.5 text-base font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-50"
      >
        {status === "loading" ? loadingLabel : "Generate ✨"}
      </button>

      {errorMsg && (
        <p role="alert" className="text-sm text-danger">
          {errorMsg}
        </p>
      )}

      {art && (
        <div className="flex flex-col gap-3">
          <div className="glass-card art-preview-container rounded-card p-4">
            <pre className="art-preview text-lg">{art}</pre>
          </div>
          <StickyActionBar onCopy={handleCopy} onShare={handleShare} />
        </div>
      )}
    </div>
  );
}
