import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavBar } from "@/components/shared/NavBar";

export const metadata: Metadata = {
  title: "EmojiForge AI — Turn anything into emoji art",
  description:
    "Generate AI emoji art, kaomoji, photo mosaics, and stickers. Fast, mobile-first, and free to try.",
  manifest: "/manifest.json",
  openGraph: {
    title: "EmojiForge AI",
    description: "Type something, upload a photo, or pick an emoji — and turn it into something beautiful.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EmojiForge AI",
    description: "AI emoji art, kaomoji, photo mosaics and stickers.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to content
        </a>
        <NavBar />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
