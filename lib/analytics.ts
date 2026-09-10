/**
 * GA4 helpers (cliente). No enviar PII (email, passwords, etc.).
 */

export const GA_MEASUREMENT_ID = "G-BBG4ENY11K";

export type GaEventName =
  | "login"
  | "sign_up"
  | "scan"
  | "new_prod"
  | "view_prod"
  | "rate_prod"
  | "share_prod"
  | "fav_prod"
  | "new_list"
  | "view_list"
  | "fav_list"
  | "share_list"
  | "new_shop"
  | "view_shop"
  | "rate_shop"
  | "nearme_shop";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  name: GaEventName,
  params?: Record<string, string | number | boolean | undefined>
): void {
  if (typeof window === "undefined") return;
  const cleaned: Record<string, string | number | boolean> = {};
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) cleaned[k] = v;
    }
  }
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", name, cleaned);
      return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...cleaned });
  } catch {
    /* no-op */
  }
}
