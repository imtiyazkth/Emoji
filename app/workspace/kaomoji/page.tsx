import type { Metadata } from "next";
import { ToolTabs } from "@/components/shared/ToolTabs";
import { KaomojiConverter } from "@/components/kaomoji/KaomojiConverter";

export const metadata: Metadata = {
  title: "Emoji → Kaomoji | EmojiForge AI",
  description: "Convert emoji into kaomoji instantly — works offline, no AI call needed.",
};

export default function KaomojiPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold">Emoji → Kaomoji</h1>
      <ToolTabs active="/workspace/kaomoji" />
      <section className="glass-card rounded-card p-4">
        <KaomojiConverter />
      </section>
    </div>
  );
}
