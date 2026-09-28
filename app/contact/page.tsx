import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | EmojiForge AI",
  description: "Get in touch with the EmojiForge AI team.",
};

// Replace these placeholders with real values before launch.
const CONTACT_EMAIL = "hello@example.com";
const OWNER_NAME = "[OWNER NAME]";

export default function ContactPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-10">
      <h1 className="text-xl font-bold">Contact</h1>
      <p className="text-sm text-text-secondary">
        Questions, feedback, bug reports, or partnership inquiries — reach {OWNER_NAME} directly.
      </p>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="w-fit rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
      >
        Email {CONTACT_EMAIL}
      </a>
      <p className="text-xs text-text-secondary">
        For privacy-related requests (deleting local Memory data, questions about data handling), see the{" "}
        <a href="/privacy" className="underline underline-offset-4">
          Privacy page
        </a>{" "}
        first — most of it you can do yourself, instantly, without contacting us.
      </p>
    </div>
  );
}
