export interface EmojiPalette {
  id: string;
  name: string;
  /** Ordered dark -> light for brightness-based selection. */
  emojis: string[];
}

export const PALETTES: EmojiPalette[] = [
  { id: "classic", name: "Classic Blocks", emojis: ["⬛", "🟫", "🟪", "🟥", "🟧", "🟨", "🟩", "🟦", "⬜"] },
  { id: "hearts", name: "Hearts", emojis: ["🖤", "💜", "💙", "💚", "💛", "🧡", "❤️", "💗", "🤍"] },
  { id: "animals", name: "Animals", emojis: ["🐻", "🐼", "🦊", "🐵", "🐶", "🐱", "🐰", "🐤", "🐣"] },
  { id: "nature", name: "Nature", emojis: ["🌑", "🌲", "🌳", "🍂", "🌻", "🌼", "🌿", "🍀", "☀️"] },
  { id: "food", name: "Food", emojis: ["🍫", "🍩", "🍞", "🥕", "🍋", "🍏", "🍉", "🍇", "🥛"] },
  { id: "space", name: "Space", emojis: ["⚫", "🪐", "🌌", "🌠", "🌙", "☁️", "✨", "🌟", "⚪"] },
  { id: "monochrome", name: "Monochrome", emojis: ["⬛", "◾", "▪️", "◽", "▫️", "⬜"] },
];

export function getPalette(id: string): EmojiPalette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0]!;
}

/** Pick an emoji from a brightness-ordered palette given 0..255 brightness. */
export function emojiForBrightness(palette: EmojiPalette, brightness: number): string {
  const idx = Math.min(palette.emojis.length - 1, Math.floor((brightness / 256) * palette.emojis.length));
  return palette.emojis[Math.max(0, idx)]!;
}
