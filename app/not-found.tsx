import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-4xl" aria-hidden="true">
        🔍
      </p>
      <h1 className="text-lg font-bold">Page not found</h1>
      <p className="max-w-sm text-sm text-text-secondary">We couldn&apos;t find that page.</p>
      <Link href="/" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white">
        Back home
      </Link>
    </div>
  );
}
