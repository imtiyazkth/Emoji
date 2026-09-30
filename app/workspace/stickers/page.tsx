import type { Metadata } from "next";
import { ToolTabs } from "@/components/shared/ToolTabs";
import { StickerStudio } from "@/components/sticker/StickerStudio";

export const metadata: Metadata = {
  title: "Sticker Studio | EmojiForge AI",
  description: "Design a sticker with styled text, colors, emoji, and AI emoji art — drag, resize, rotate, then export as PNG.",
};

export default function StickersPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold">Sticker Studio</h1>
      <ToolTabs active="/workspace/stickers" />
      <section className="glass-card rounded-card p-4">
        <StickerStudio />
      </section>
    </div>
  );
}
