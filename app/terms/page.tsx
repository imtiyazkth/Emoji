import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms | EmojiForge AI",
  description: "Terms of use for EmojiForge AI.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-xl font-bold">Terms of Use</h1>
      <p className="text-sm text-text-secondary">
        EmojiForge AI is provided as-is for creating and sharing emoji art, kaomoji, mosaics, and stickers. Don&apos;t
        use it to generate hateful, illegal, or harmful content — see our moderation policy in the product
        documentation. This is placeholder MVP copy; replace with reviewed legal terms before public launch.
      </p>
    </div>
  );
}
