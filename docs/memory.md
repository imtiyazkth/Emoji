# My Memory (local creation library)

## What it is

A private, on-device library of everything the user generates —
"remember what I made, so I don't have to start from zero again."
Implemented in `lib/memory/db.ts` (a dependency-free IndexedDB wrapper)
and `lib/memory/creations.ts` (the CRUD/search API), with the UI in
`components/memory/MemoryLibrary.tsx` at `/memory`.

## Why IndexedDB, not localStorage

`localStorage` is a synchronous, ~5MB, string-only key-value store —
too small and too slow for a growing library of creations.
`IndexedDB` gives structured records, much higher storage limits, and
async access that doesn't block the UI thread. No external library
(e.g. Dexie) is used — `lib/memory/db.ts` is a small, dependency-free
wrapper, so there's nothing extra to install.

## What gets stored (and what deliberately doesn't)

A `Creation` record (see `lib/memory/creations.ts`) stores: an id,
timestamps, a title, the original input text, the generated output,
which tool made it (`mode`), style/category, tags, and a favorite flag.

It deliberately does **not** store anything that would turn a creation
history into a behavioral profile — no inferred emotional state about
the user, no cross-session tracking, no data that leaves the device
unless the user explicitly shares a creation. This is a library of
outputs, not a dossier.

## Reuse without regeneration

Opening a saved creation displays the stored `generatedOutput`
directly — it never calls `/api/generate` again. This is the point of
the whole system: browsing your library, favoriting, duplicating, and
deleting are all instant and free (no AI cost, no network round trip).
Only an explicit "Regenerate" action (not yet built — see below) should
ever call the AI again for something already in Memory.

## Search

`searchCreations()` does a plain case-insensitive substring match
across title, original input, category, style, and tags — entirely
client-side, no AI call, no network request (per spec: "use lightweight
local search first").

## Known limitations / not yet built

- **Not tested in a real browser.** This was authored in a sandboxed
  environment with no browser available, so `lib/memory/db.ts` has
  never actually run against a real IndexedDB implementation. Before
  relying on it: open the deployed site, use each tool once, then open
  `/memory` and confirm creations appear, favorite/duplicate/delete all
  work, and check the browser's DevTools → Application → IndexedDB
  panel to confirm the `emojiforge_memory` database and `creations`
  store exist with the expected shape.
- **No explicit "Regenerate" action** in the Memory UI yet — only
  Copy/Duplicate/Delete/Favorite. Adding Regenerate means calling
  `/api/generate` again with the creation's `originalInput`/`style` and
  saving the new result as a fresh creation (don't overwrite the old
  one, so both remain reusable).
- **No account-based cloud sync.** Everything is local-only per device
  per browser — clearing browser data deletes the library. An "Optional
  Sign In → Cloud Sync" tier (spec section 20) is architected for but
  not implemented; it would sit behind the same `Creation` shape,
  synced through a new server-side store.
- **No export/import UI** — `exportAllCreations()` exists in
  `lib/memory/creations.ts` (returns JSON) but isn't wired to a
  download button yet.
- **Kaomoji/mosaic/sticker tools don't auto-save yet** — only the
  Text → Emoji Art tool (`components/emoji-art/GenerateForm.tsx`) calls
  `saveCreation()` today. Wire the same call into
  `KaomojiConverter.tsx`, `MosaicGenerator.tsx`, and `StickerStudio.tsx`
  using their respective `mode` values (`"kaomoji"`, `"mosaic"`,
  `"sticker"`) to complete this.
