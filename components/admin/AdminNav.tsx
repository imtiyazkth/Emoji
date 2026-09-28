import Link from "next/link";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/patterns", label: "Patterns" },
  { href: "/admin/projects", label: "Projects" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <nav aria-label="Admin sections" className="flex gap-2 border-b border-border pb-3">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            active === l.href ? "bg-primary/20 text-primary" : "text-text-secondary"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
