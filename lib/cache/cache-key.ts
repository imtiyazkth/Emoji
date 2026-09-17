import { slugifyIntent } from "../unicode";

export interface CacheKeyInput {
  text: string;
  style: string;
  language: string;
  mode?: string;
  palette?: string;
  templateVersion?: string;
}

/**
 * Deterministic cache key. Never keyed on raw user text alone — always
 * combined with style/language/mode so "I love you" (bunny) and
 * "I love you" (dark) don't collide.
 */
export function buildCacheKey(input: CacheKeyInput): string {
  const parts = [
    "art",
    input.templateVersion ?? "v1",
    input.style,
    input.language,
    slugifyIntent(input.text),
  ];
  if (input.mode) parts.push(input.mode);
  if (input.palette) parts.push(input.palette);
  return parts.join(":");
}

export function buildIntentKey(category: string, text: string): string {
  return `${category}:${slugifyIntent(text)}`;
}
