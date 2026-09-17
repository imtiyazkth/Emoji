/**
 * Only officially-documented share URL patterns are used here — no
 * undocumented WhatsApp/Telegram "install sticker" capabilities are
 * claimed or implemented (see docs/api.md "Sharing limitations").
 */
export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function buildTelegramShareUrl(url: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
}
