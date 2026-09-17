# Attribution & Licensing

## Emoji rendering

EmojiForge AI does not bundle a custom emoji font by default — it
relies on the user's system emoji font (Apple Color Emoji, Noto Color
Emoji, Segoe UI Emoji, etc.), which requires no licensing on our part
and guarantees consistent OS-native rendering.

If OpenMoji-style bundled assets are added later:

- OpenMoji (<https://openmoji.org/>) is licensed CC BY-SA 4.0 —
  attribution and share-alike terms must be honored and stated here.
- Noto Color Emoji (<https://fonts.google.com/noto/specimen/Noto+Color+Emoji>)
  is licensed under the SIL Open Font License — permitted for bundling,
  but include its license file alongside the asset.

**Do not add third-party emoji/art assets to this repo without updating
this file with the specific license and attribution required.**

## Text-art / kaomoji content

All seed content in `data/emoji_art_db.json` and `data/kaomoji_db.json`
is originally authored for this project. Do not bulk-import
third-party ASCII/Unicode art collections without verifying licensing
and recording provenance in `source`/`user_intent_keywords` metadata on
each record — see spec section 44 ("Third-Party Data / Copyright") for
the policy this enforces.

## User-contributed content

Any future user-submission feature must route through the moderation
queue (`data/moderation.json`, `lib/moderation/`) before a record's
`source` can be `user_contributed` and before it's eligible for
`featured: true`.
