import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

function isMapTileRequest(url: URL): boolean {
  const h = url.hostname;
  return (
    h.endsWith("tile.openstreetmap.org") ||
    h.endsWith("basemaps.cartocdn.com") ||
    h === "unpkg.com"
  );
}

function isAnalyticsRequest(url: URL): boolean {
  const h = url.hostname;
  return (
    h === "www.googletagmanager.com" ||
    h === "www.google-analytics.com" ||
    h.endsWith(".google-analytics.com") ||
    h === "analytics.google.com" ||
    h.endsWith(".analytics.google.com")
  );
}

function isSupabaseRequest(url: URL): boolean {
  return url.hostname.endsWith(".supabase.co");
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) =>
        isMapTileRequest(url) ||
        isAnalyticsRequest(url) ||
        isSupabaseRequest(url),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
