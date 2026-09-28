"use client";

import { hasConsentFor } from "../consent/consent";

/**
 * Pluggable analytics abstraction (spec section 41). Track product-level
 * events, never invasive personal profiling — see the event names below.
 *
 * No real analytics service is wired up by default: this ships a
 * NoopAnalyticsProvider so the app makes zero third-party network calls
 * out of the box. Swap `getAnalyticsProvider()`'s return value for a
 * real provider (Google Analytics, Plausible, PostHog, etc.) once one
 * is actually configured — every `trackEvent()` call site elsewhere in
 * the app stays the same.
 */

export type AnalyticsEvent =
  | "page_view"
  | "generation_started"
  | "generation_success"
  | "generation_failed"
  | "cache_hit"
  | "cache_miss"
  | "art_saved"
  | "art_reused"
  | "art_shared"
  | "art_downloaded"
  | "sticker_created"
  | "mosaic_created"
  | "project_clicked"
  | "ad_slot_viewed";

export interface AnalyticsProvider {
  track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void;
}

class NoopAnalyticsProvider implements AnalyticsProvider {
  track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
    if (process.env.NODE_ENV !== "production") {
      // Dev-only visibility into what *would* be tracked once a real
      // provider is wired up — never sent anywhere.
      // eslint-disable-next-line no-console
      console.debug("[analytics:noop]", event, props ?? {});
    }
  }
}

const provider: AnalyticsProvider = new NoopAnalyticsProvider();

export function getAnalyticsProvider(): AnalyticsProvider {
  return provider;
}

/** Respects the user's analytics consent choice — no-ops if not granted. */
export function trackEvent(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;
  if (!hasConsentFor("analytics")) return;
  getAnalyticsProvider().track(event, props);
}
