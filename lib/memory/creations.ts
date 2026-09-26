import { idbGetAll, idbGet, idbPut, idbDelete, idbClear } from "./db";

/**
 * A single saved creation in the user's local "My Memory" library.
 * Deliberately excludes anything that would turn this into a behavioral
 * profile (spec section 18) — it stores what the user made, not
 * inferences about the user.
 */
export interface Creation {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  originalInput: string;
  generatedOutput: string;
  mode: "text-to-art" | "kaomoji" | "mosaic" | "sticker";
  style?: string;
  category?: string;
  tags: string[];
  favorite: boolean;
}

function newId(): string {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function saveCreation(input: Omit<Creation, "id" | "createdAt" | "updatedAt" | "favorite" | "tags"> & { tags?: string[] }): Promise<Creation> {
  const now = new Date().toISOString();
  const record: Creation = {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    favorite: false,
    tags: input.tags ?? [],
    title: input.title,
    originalInput: input.originalInput,
    generatedOutput: input.generatedOutput,
    mode: input.mode,
    style: input.style,
    category: input.category,
  };
  await idbPut(record);
  return record;
}

export async function listCreations(): Promise<Creation[]> {
  const all = await idbGetAll<Creation>();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listFavorites(): Promise<Creation[]> {
  const all = await listCreations();
  return all.filter((c) => c.favorite);
}

export async function listByMode(mode: Creation["mode"]): Promise<Creation[]> {
  const all = await listCreations();
  return all.filter((c) => c.mode === mode);
}

export async function toggleFavorite(id: string): Promise<Creation | undefined> {
  const existing = await idbGet<Creation>(id);
  if (!existing) return undefined;
  const updated = { ...existing, favorite: !existing.favorite, updatedAt: new Date().toISOString() };
  await idbPut(updated);
  return updated;
}

export async function renameCreation(id: string, title: string): Promise<Creation | undefined> {
  const existing = await idbGet<Creation>(id);
  if (!existing) return undefined;
  const updated = { ...existing, title, updatedAt: new Date().toISOString() };
  await idbPut(updated);
  return updated;
}

export async function deleteCreation(id: string): Promise<void> {
  await idbDelete(id);
}

export async function duplicateCreation(id: string): Promise<Creation | undefined> {
  const existing = await idbGet<Creation>(id);
  if (!existing) return undefined;
  const now = new Date().toISOString();
  const copy: Creation = { ...existing, id: newId(), title: `${existing.title} (copy)`, createdAt: now, updatedAt: now };
  await idbPut(copy);
  return copy;
}

/** Lightweight local search — never calls an AI model for this (spec section 22). */
export async function searchCreations(query: string): Promise<Creation[]> {
  const q = query.trim().toLowerCase();
  const all = await listCreations();
  if (!q) return all;
  return all.filter((c) =>
    [c.title, c.originalInput, c.category ?? "", c.style ?? "", ...c.tags].some((field) =>
      field.toLowerCase().includes(q)
    )
  );
}

export async function exportAllCreations(): Promise<string> {
  const all = await listCreations();
  return JSON.stringify(all, null, 2);
}

export async function clearAllCreations(): Promise<void> {
  await idbClear();
}
