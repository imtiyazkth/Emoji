import type { Metadata } from "next";
import { MemoryLibrary } from "@/components/memory/MemoryLibrary";

export const metadata: Metadata = {
  title: "My Memory | EmojiForge AI",
  description: "Your personal library of saved creations — reuse them instantly, no regeneration needed.",
};

export default function MemoryPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-24 pt-6">
      <div>
        <h1 className="text-xl font-bold">My Memory</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Everything you create is saved here on your device — open it anytime without generating again.
        </p>
      </div>
      <MemoryLibrary />
    </div>
  );
}
