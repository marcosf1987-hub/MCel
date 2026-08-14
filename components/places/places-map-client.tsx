"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { PlaceListItem } from "@/lib/places-server";

const PlacesMap = dynamic(
  () =>
    import("@/components/places/places-map").then((m) => m.PlacesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[280px] w-full items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-brand-cream)] text-sm text-[var(--color-muted-foreground)]">
        Cargando mapa…
      </div>
    ),
  }
);

export function PlacesMapClient({
  places,
  userLocation = null,
  selectedId = null,
  onSelect,
  className,
  compact = false,
}: {
  places: PlaceListItem[];
  userLocation?: { lat: number; lng: number } | null;
  selectedId?: string | null;
  onSelect?: (placeId: string) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <PlacesMap
      places={places}
      userLocation={userLocation}
      selectedId={selectedId}
      onSelect={onSelect}
      className={cn(
        "w-full overflow-hidden rounded-xl border border-[var(--color-border)]",
        compact ? "h-[240px] md:h-[280px]" : "h-[min(55vh,420px)] md:h-[min(70vh,560px)]",
        className
      )}
    />
  );
}
