import type { Metadata } from "next";
import { ToolTabs } from "@/components/shared/ToolTabs";
import { GenerateForm } from "@/components/emoji-art/GenerateForm";

export const metadata: Metadata = {
  title: "Text → Emoji Art | EmojiForge AI",
  description: "Turn any phrase into AI-generated Unicode emoji art.",
};

export default function TextArtPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold">Text → Emoji Art</h1>
      <ToolTabs active="/workspace/text-art" />
      <section className="glass-card rounded-card p-4">
        <GenerateForm />
      </section>
    </div>
  );
}
