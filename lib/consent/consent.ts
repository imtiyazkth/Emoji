/**
 * Minimal consent system. Categories match spec section 34: necessary
 * (always on, no toggle), analytics, advertising, functional. Nothing
 * optional (analytics/ads) should initialize before the user has made
 * a choice — see hasConsentFor() usage in lib/analytics and AdSlot.
 */

export type ConsentCategory = "necessary" | "analytics" | "advertising" | "functional";

export interface ConsentState {
  necessary: true; // always granted — required for the site to function
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
  decidedAt: string;
}

const STORAGE_KEY = "efai_consent";

export function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function hasDecided(): boolean {
  return getStoredConsent() !== null;
}

export function hasConsentFor(category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  const state = getStoredConsent();
  return state ? state[category] : false; // no decision yet = no optional tracking
}

function save(state: ConsentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("efai:consent-changed", { detail: state }));
}

export function acceptAll(): void {
  save({ necessary: true, analytics: true, advertising: true, functional: true, decidedAt: new Date().toISOString() });
}

export function acceptNecessaryOnly(): void {
  save({
    necessary: true,
    analytics: false,
    advertising: false,
    functional: false,
    decidedAt: new Date().toISOString(),
  });
}

export function resetConsent(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
