export interface FontOption {
  id: string;
  label: string;
  family: string; // CSS font-family value, web-safe only (no network fonts)
}

/** Web-safe only — Canvas can't wait on a webfont load, so a custom font
 * silently falls back to the browser default mid-render if it isn't
 * already available. Every option here ships with every OS. */
export const FONTS: FontOption[] = [
  { id: "sans", label: "Sans", family: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
  { id: "rounded", label: "Rounded", family: "Verdana, Tahoma, sans-serif" },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "mono", label: "Mono", family: "'Courier New', monospace" },
  { id: "impact", label: "Impact", family: "Impact, 'Arial Black', sans-serif" },
  { id: "comic", label: "Comic", family: "'Comic Sans MS', 'Comic Sans', cursive" },
];

export function fontFamilyFor(fontId: string): string {
  return FONTS.find((f) => f.id === fontId)?.family ?? FONTS[0]!.family;
}

export interface TextStylePreset {
  id: string;
  label: string;
  color: string;
  outlineColor: string;
  outlineWidth: number;
  shadow: boolean;
  shadowColor: string;
  bold: boolean;
  bgColor: string | null;
}

/** One-tap looks — each sets colour + outline + shadow + weight together,
 * matching the "meme caption", "neon", "clean" archetypes people expect. */
export const TEXT_STYLE_PRESETS: TextStylePreset[] = [
  {
    id: "classic-meme",
    label: "Meme",
    color: "#ffffff",
    outlineColor: "#000000",
    outlineWidth: 8,
    shadow: false,
    shadowColor: "#000000",
    bold: true,
    bgColor: null,
  },
  {
    id: "clean",
    label: "Clean",
    color: "#0b0b12",
    outlineColor: "#ffffff",
    outlineWidth: 0,
    shadow: true,
    shadowColor: "#00000055",
    bold: false,
    bgColor: null,
  },
  {
    id: "neon",
    label: "Neon",
    color: "#39ff88",
    outlineColor: "#0b3d1f",
    outlineWidth: 2,
    shadow: true,
    shadowColor: "#39ff88",
    bold: true,
    bgColor: null,
  },
  {
    id: "sticker-pop",
    label: "Pop",
    color: "#ffffff",
    outlineColor: "#a855f7",
    outlineWidth: 6,
    shadow: true,
    shadowColor: "#00000066",
    bold: true,
    bgColor: null,
  },
  {
    id: "label",
    label: "Label",
    color: "#ffffff",
    outlineColor: "#000000",
    outlineWidth: 0,
    shadow: false,
    shadowColor: "#000000",
    bold: true,
    bgColor: "#a855f7",
  },
];

export const SWATCHES: string[] = [
  "#ffffff",
  "#0b0b12",
  "#f87171",
  "#fbbf24",
  "#34d399",
  "#22d3ee",
  "#a855f7",
  "#ec4899",
];

/** A small curated emoji picker — kept short and on-purpose rather than
 * pulling in a full emoji-picker dependency for an MVP sticker tool. */
export const EMOJI_PICKER: { category: string; emojis: string[] }[] = [
  { category: "Faces", emojis: ["😂", "😭", "😍", "😎", "🥺", "😡", "🤔", "😴", "🥳", "😱", "🙄", "😏"] },
  { category: "Hearts", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💗", "💔", "❣️"] },
  { category: "Hands", emojis: ["👍", "👎", "👏", "🙏", "🤝", "✌️", "🤙", "👋", "💪", "🫶", "🤞", "🫡"] },
  { category: "Fun", emojis: ["🔥", "✨", "🎉", "💯", "⭐", "🎂", "🎁", "⚡", "💀", "👻", "🐰", "🐱"] },
];
