import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | EmojiForge AI",
  description: "What EmojiForge AI is and how it works.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-xl font-bold">About EmojiForge AI</h1>
      <p className="text-sm text-text-secondary">
        EmojiForge AI turns a phrase, an emoji, or a photo into emoji art, kaomoji, mosaics, and stickers. It uses
        a cache-first design: most requests are answered from a library of reviewed patterns, and AI is only used
        to fill gaps — keeping the product fast and low-cost.
      </p>
    </div>
  );
}
