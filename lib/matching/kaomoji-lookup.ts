import kaomojiDb from "../../data/kaomoji_db.json";
import { KaomojiDbSchema } from "../utils/schemas";
import { normalizeForMatching } from "../unicode";

const db = KaomojiDbSchema.parse(kaomojiDb);

/** Pure local dictionary lookup — deliberately never calls the AI provider. */
export function lookupKaomoji(query: string): { emoji: string; kaomojis: string[]; category: string } | null {
  const normalized = normalizeForMatching(query);
  for (const entry of db.entries) {
    if (entry.emoji === query) return entry;
    if (entry.aliases.some((a) => normalizeForMatching(a) === normalized)) return entry;
  }
  return null;
}

export function searchKaomoji(query: string): typeof db.entries {
  const normalized = normalizeForMatching(query);
  if (!normalized) return db.entries;
  return db.entries.filter(
    (e) =>
      e.emoji === query ||
      e.category === normalized ||
      e.aliases.some((a) => normalizeForMatching(a).includes(normalized))
  );
}

export function randomKaomoji(category?: string): { emoji: string; kaomoji: string; category: string } {
  const pool = category ? db.entries.filter((e) => e.category === category) : db.entries;
  const source = pool.length > 0 ? pool : db.entries;
  const entry = source[Math.floor(Math.random() * source.length)]!;
  const kaomoji = entry.kaomojis[Math.floor(Math.random() * entry.kaomojis.length)]!;
  return { emoji: entry.emoji, kaomoji, category: entry.category };
}

export function listAllKaomoji() {
  return db.entries;
}
