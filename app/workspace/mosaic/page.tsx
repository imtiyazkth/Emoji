import type { Metadata } from "next";
import { ToolTabs } from "@/components/shared/ToolTabs";
import { MosaicGenerator } from "@/components/mosaic/MosaicGenerator";

export const metadata: Metadata = {
  title: "Photo → Emoji Mosaic | EmojiForge AI",
  description: "Turn any photo into an emoji mosaic, processed entirely in your browser.",
};

export default function MosaicPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-24 pt-6">
      <h1 className="text-xl font-bold">Photo → Emoji Mosaic</h1>
      <ToolTabs active="/workspace/mosaic" />
      <section className="glass-card rounded-card p-4">
        <MosaicGenerator />
      </section>
    </div>
  );
}
