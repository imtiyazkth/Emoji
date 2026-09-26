import { ToolTabs } from "@/components/shared/ToolTabs";
import { GenerateForm } from "@/components/emoji-art/GenerateForm";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 pb-24 pt-6">
      <section>
        <h2 className="text-2xl font-extrabold leading-tight">
          Create Anything <br /> with Emoji &amp; AI <span aria-hidden="true">✨</span>
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          Type something, upload a photo, or pick an emoji — turn it into something beautiful.
        </p>
      </section>

      <ToolTabs active="/workspace/text-art" />

      <section className="glass-card rounded-card p-4" aria-label="Text to emoji art generator">
        <GenerateForm />
      </section>
    </div>
  );
}
