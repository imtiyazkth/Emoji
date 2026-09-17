import type { EmojiArtRecord } from "../utils/schemas";

/**
 * Storage-agnostic repository contract. UI and API routes depend ONLY on
 * this interface — never on GitHub or filesystem specifics — so swapping
 * to Redis/Postgres/Mongo/a vector index later (see docs/database.md)
 * never requires touching components or routes, only adding a new
 * implementation of this interface.
 */
export interface ArtRepository {
  findByIntentKey(intentKey: string): Promise<EmojiArtRecord | null>;
  findSimilar(query: string, style: string, threshold?: number): Promise<EmojiArtRecord | null>;
  create(record: EmojiArtRecord): Promise<EmojiArtRecord>;
  update(id: string, patch: Partial<EmojiArtRecord>): Promise<EmojiArtRecord | null>;
  incrementHit(id: string): Promise<void>;
  listFeatured(limit?: number): Promise<EmojiArtRecord[]>;
  listAll(): Promise<EmojiArtRecord[]>;
}
