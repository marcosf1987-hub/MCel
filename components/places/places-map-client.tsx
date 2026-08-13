"use client";

import dynamic from "next/dynamic";
import type { PlaceListItem } from "@/lib/places-server";

const PlacesMap = dynamic(
  () =>
    import("@/components/places/places-map").then((m) => m.PlacesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-brand-cream)] text-sm text-[var(--color-muted-foreground)]">
        Cargando mapa…
      </div>
    ),
  }
);

export function PlacesMapClient({
  places,
  userLocation = null,
}: {
  places: PlaceListItem[];
  userLocation?: { lat: number; lng: number } | null;
}) {
  return (
    <PlacesMap
      places={places}
      userLocation={userLocation}
      className="h-[420px] w-full overflow-hidden rounded-xl border border-[var(--color-border)]"
    />
  );
}
