import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | EmojiForge AI",
  description: "How EmojiForge AI handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-xl font-bold">Privacy</h1>
      <div className="flex flex-col gap-3 text-sm text-text-secondary">
        <p>Photos you upload for the Photo Mosaic tool are processed entirely in your browser and are never uploaded to our servers.</p>
        <p>Text you submit for emoji art generation may be sent to our AI provider (Groq) to generate a result, and a privacy-minimizing, anonymized record of the request (tool, style, cache hit/miss, latency) may be kept for product analytics. We avoid storing raw personal text beyond what's needed to serve the cached pattern.</p>
        <p>Admin accounts are authenticated separately and are not exposed to end users.</p>
      </div>
    </div>
  );
}
