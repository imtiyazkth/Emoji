import Link from "next/link";

const LINKS = [
  { href: "/", label: "Create" },
  { href: "/memory", label: "My Memory" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
];

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3" aria-label="Main">
        <Link href="/" className="text-sm font-bold tracking-tight">
          EmojiForge AI
        </Link>
        <ul className="flex items-center gap-1">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3 py-1.5 text-sm text-text-secondary transition hover:bg-surface hover:text-text-primary"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
