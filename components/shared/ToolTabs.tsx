import Link from "next/link";

const TABS = [
  { href: "/workspace/text-art", label: "Text Art", icon: "✨" },
  { href: "/workspace/kaomoji", label: "Kaomoji", icon: "(≧▽≦)" },
  { href: "/workspace/mosaic", label: "Photo Mosaic", icon: "🖼️" },
  { href: "/workspace/stickers", label: "Stickers", icon: "🏷️" },
];

export function ToolTabs({ active }: { active?: string }) {
  return (
    <nav aria-label="Tools" className="grid grid-cols-4 gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`glass-card rounded-card flex flex-col items-center gap-1 py-3 text-xs font-medium transition hover:border-primary/60 ${
            active === tab.href ? "border-primary text-primary" : "text-text-secondary"
          }`}
        >
          <span className="text-lg" aria-hidden="true">
            {tab.icon}
          </span>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
