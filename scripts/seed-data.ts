/**
 * Re-seeds data/emoji_art_db.json and data/kaomoji_db.json to a known
 * baseline. Useful for local dev resets and for CI fixtures. This never
 * touches GitHub directly — it only writes local files; use the admin
 * "push to GitHub" flow (or the GitHub UI) to publish a seed to prod.
 */
import { writeFileSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

const emojiArtDb = {
  database_version: "1.0.0",
  last_updated: new Date().toISOString(),
  total_records: 3,
  emoji_arts: [
    {
      id: "art_001",
      intent_key: "love:i-love-you",
      user_intent_keywords: ["love", "i love you", "cute", "bunny"],
      category: "love",
      style: "bunny",
      language: "en",
      hit_count: 0,
      quality_score: 0.9,
      source: "seed",
      status: "active",
      featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_text_art: "(\\__/)\n( • • )\n( >❤️ [USER_TEXT] 🫶\n U U",
    },
    {
      id: "art_002",
      intent_key: "birthday:happy-birthday",
      user_intent_keywords: ["happy birthday", "birthday", "celebration"],
      category: "birthday",
      style: "celebration",
      language: "en",
      hit_count: 0,
      quality_score: 0.85,
      source: "seed",
      status: "active",
      featured: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_text_art: "🎉🎂🎈\n[USER_TEXT]\n🎈🎂🎉",
    },
    {
      id: "art_003",
      intent_key: "morning:good-morning",
      user_intent_keywords: ["good morning", "morning", "sunrise"],
      category: "morning",
      style: "minimal",
      language: "en",
      hit_count: 0,
      quality_score: 0.8,
      source: "seed",
      status: "active",
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_text_art: "☀️  [USER_TEXT]  ☀️\n~~~~~~~~~~~~~~~~",
    },
  ],
};

writeFileSync(path.join(DATA_DIR, "emoji_art_db.json"), JSON.stringify(emojiArtDb, null, 2));
console.log("✅ Re-seeded data/emoji_art_db.json");
