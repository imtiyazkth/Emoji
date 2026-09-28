import adConfig from "@/data/ad_config.json";

export type AdPosition = "top" | "sidebar" | "betweenContent" | "footer";

/**
 * Isolated ad-slot component. This is architecture only — it does NOT
 * load any real ad network script. Wiring up actual AdSense (or another
 * network) means: (1) get an approved AdSense account + publisher ID,
 * (2) set data/ad_config.json's adsEnabled/publisherId/placements,
 * (3) add the actual <ins class="adsbygoogle"> markup + loader script
 * here, gated behind the same config. Until then this renders nothing,
 * so it's safe to drop into any page ahead of time.
 *
 * Deliberately never placed inside My Memory or other private-library
 * screens — see docs (spec section 37, "no ads in private communication
 * areas") and simply don't import this component on those pages.
 */
export function AdSlot({ position }: { position: AdPosition }) {
  if (!adConfig.adsEnabled) return null;
  if (!adConfig.placements[position]) return null;
  if (!adConfig.publisherId) return null;

  // No real ad markup yet — see the doc comment above for what's needed
  // before this can render anything. Placeholder kept intentionally
  // inert so an unfinished config never shows broken ad UI to users.
  return null;
}
