/**
 * Validates every JSON file in data/ against its Zod schema.
 * Run via `npm run validate:json`. Also runs in CI before build.
 */
import { readFileSync } from "fs";
import path from "path";
import { EmojiArtDbSchema, KaomojiDbSchema, FeatureFlagsSchema } from "../lib/utils/schemas";

const DATA_DIR = path.join(process.cwd(), "data");

function load(file: string): unknown {
  return JSON.parse(readFileSync(path.join(DATA_DIR, file), "utf-8"));
}

function main() {
  const checks: [string, () => void][] = [
    ["emoji_art_db.json", () => EmojiArtDbSchema.parse(load("emoji_art_db.json"))],
    ["kaomoji_db.json", () => KaomojiDbSchema.parse(load("kaomoji_db.json"))],
    ["feature_flags.json", () => FeatureFlagsSchema.parse(load("feature_flags.json"))],
  ];

  let failed = false;
  for (const [name, check] of checks) {
    try {
      check();
      console.log(`✅ ${name} is valid`);
    } catch (err) {
      failed = true;
      console.error(`❌ ${name} failed validation:`);
      console.error(err);
    }
  }

  if (failed) {
    process.exit(1);
  }
  console.log("All data files valid.");
}

main();
