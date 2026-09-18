"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center text-text-primary">
        <p className="text-4xl" aria-hidden="true">
          😵
        </p>
        <h1 className="text-lg font-bold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-text-secondary">
          That&apos;s on us, not you. Please try again — if it keeps happening, refresh the page.
        </p>
        <button onClick={reset} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          Try again
        </button>
      </body>
    </html>
  );
}
