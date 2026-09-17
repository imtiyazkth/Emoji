"use client";

export function StickyActionBar({
  onCopy,
  onShare,
  onSticker,
}: {
  onCopy: () => void;
  onShare: () => void;
  onSticker?: () => void;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 flex gap-2 border-t border-border bg-surface/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
      <button
        onClick={onCopy}
        className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white active:scale-95 transition"
      >
        Copy
      </button>
      <button
        onClick={onShare}
        className="flex-1 rounded-full border border-border bg-surface-elevated px-4 py-3 text-sm font-semibold active:scale-95 transition"
      >
        Share
      </button>
      {onSticker && (
        <button
          onClick={onSticker}
          className="flex-1 rounded-full border border-border bg-surface-elevated px-4 py-3 text-sm font-semibold active:scale-95 transition"
        >
          Sticker
        </button>
      )}
    </div>
  );
}
