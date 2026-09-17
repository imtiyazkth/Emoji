/**
 * Runtime schema validation (Zod) for every JSON document EmojiForge AI
 * persists — either locally on disk (MVP) or in the GitHub JSON store.
 *
 * Nothing is ever committed to GitHub (see lib/github/repository.ts)
 * without passing through the matching `parse()` here first. This is
 * the single source of truth for "what a valid record looks like".
 */
import { z } from "zod";

export const EmojiArtRecordSchema = z.object({
  id: z.string().min(1),
  intent_key: z.string().min(1),
  user_intent_keywords: z.array(z.string()).default([]),
  category: z.string().min(1),
  style: z.string().min(1),
  language: z.string().default("en"),
  hit_count: z.number().int().nonnegative().default(0),
  quality_score: z.number().min(0).max(1).default(0),
  source: z.enum(["seed", "groq_ai_generated", "user_contributed", "admin_authored"]),
  status: z.enum(["active", "pending", "hidden", "rejected"]).default("active"),
  featured: z.boolean().default(false),
  created_at: z.string(),
  updated_at: z.string(),
  raw_text_art: z.string().min(1).max(4000),
});
export type EmojiArtRecord = z.infer<typeof EmojiArtRecordSchema>;

export const EmojiArtDbSchema = z.object({
  database_version: z.string(),
  last_updated: z.string(),
  total_records: z.number().int().nonnegative(),
  emoji_arts: z.array(EmojiArtRecordSchema),
});
export type EmojiArtDb = z.infer<typeof EmojiArtDbSchema>;

export const KaomojiEntrySchema = z.object({
  emoji: z.string().min(1),
  aliases: z.array(z.string()),
  kaomojis: z.array(z.string()).min(1),
  category: z.string(),
});

export const KaomojiDbSchema = z.object({
  database_version: z.string(),
  last_updated: z.string(),
  entries: z.array(KaomojiEntrySchema),
});
export type KaomojiDb = z.infer<typeof KaomojiDbSchema>;

export const GenerateRequestSchema = z.object({
  text: z.string().min(1).max(120),
  style: z.string().min(1).max(40).default("cute"),
  category: z.string().min(1).max(40).optional(),
  language: z.string().min(2).max(10).default("en"),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

/** Structured shape the AI provider MUST return (validated before caching). */
export const AiArtOutputSchema = z.object({
  title: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  style: z.string().min(1).max(40),
  art: z.string().min(1).max(2000),
  keywords: z.array(z.string()).max(15),
});
export type AiArtOutput = z.infer<typeof AiArtOutputSchema>;

export const ModerationItemSchema = z.object({
  id: z.string(),
  input: z.string(),
  output: z.string(),
  status: z.enum(["pending", "approved", "rejected", "flagged", "hidden"]),
  reason: z.string().default(""),
  created_at: z.string(),
});

export const FeatureFlagsSchema = z.object({
  ai_generation: z.boolean(),
  semantic_cache: z.boolean(),
  sticker_studio: z.boolean(),
  telegram_share: z.boolean(),
  whatsapp_share: z.boolean(),
  maintenance_mode: z.boolean(),
});
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

export function assertValidEmojiArtDb(data: unknown): EmojiArtDb {
  return EmojiArtDbSchema.parse(data);
}
