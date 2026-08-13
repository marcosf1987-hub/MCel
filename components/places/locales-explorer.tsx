"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlacesMapClient } from "@/components/places/places-map-client";
import { distanceKm, formatDistanceKm } from "@/lib/places-geo";
import type { PlaceListItem } from "@/lib/places-server";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
  type PlaceCeliacLevel,
  type PlaceType,
} from "@/types/database";
import { Loader2, MapPin, Navigation } from "lucide-react";

type UserLocation = { lat: number; lng: number };

const RADIUS_OPTIONS = [
  { value: 0, label: "Sin límite" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
] as const;

export function LocalesExplorer({ places }: { places: PlaceListItem[] }) {
  const [typeFilter, setTypeFilter] = useState<"all" | PlaceType>("all");
  const [celiacFilter, setCeliacFilter] = useState<"all" | PlaceCeliacLevel>(
    "all"
  );
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [nearMe, setNearMe] = useState(false);
  const [radiusKm, setRadiusKm] = useState(0);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const requestNearMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Tu navegador no soporta geolocalización.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setNearMe(true);
        if (radiusKm === 0) setRadiusKm(10);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Permiso de ubicación denegado.");
        } else {
          setGeoError("No se pudo obtener tu ubicación.");
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
  };

  const clearNearMe = () => {
    setNearMe(false);
    setRadiusKm(0);
    setGeoError(null);
  };

  const visible = useMemo(() => {
    const list = places.filter((p) => {
      if (typeFilter !== "all" && p.place_type !== typeFilter) return false;
      if (celiacFilter !== "all" && p.celiac_level !== celiacFilter) return false;
      return true;
    });

    if (nearMe && userLocation) {
      let withDist = list.map((p) => ({
        place: p,
        km: distanceKm(userLocation.lat, userLocation.lng, p.lat, p.lng),
      }));
      if (radiusKm > 0) {
        withDist = withDist.filter((x) => x.km <= radiusKm);
      }
      withDist.sort((a, b) => a.km - b.km);
      return withDist;
    }

    return list
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "es"))
      .map((place) => ({ place, km: null as number | null }));
  }, [places, typeFilter, celiacFilter, nearMe, userLocation, radiusKm]);

  const mapPlaces = visible.map((v) => v.place);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[140px] flex-1 space-y-1">
          <label
            htmlFor="filter-type"
            className="text-xs font-medium text-[var(--color-muted-foreground)]"
          >
            Tipo
          </label>
          <select
            id="filter-type"
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "all" | PlaceType)
            }
          >
            <option value="all">Todos</option>
            {(Object.keys(PLACE_TYPE_LABELS) as PlaceType[]).map((k) => (
              <option key={k} value={k}>
                {PLACE_TYPE_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px] flex-1 space-y-1">
          <label
            htmlFor="filter-celiac"
            className="text-xs font-medium text-[var(--color-muted-foreground)]"
          >
            Nivel celíaco
          </label>
          <select
            id="filter-celiac"
            className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
            value={celiacFilter}
            onChange={(e) =>
              setCeliacFilter(e.target.value as "all" | PlaceCeliacLevel)
            }
          >
            <option value="all">Todos</option>
            {(Object.keys(PLACE_CELIAC_LABELS) as PlaceCeliacLevel[]).map(
              (k) => (
                <option key={k} value={k}>
                  {PLACE_CELIAC_LABELS[k]}
                </option>
              )
            )}
          </select>
        </div>

        {nearMe && (
          <div className="min-w-[120px] space-y-1">
            <label
              htmlFor="filter-radius"
              className="text-xs font-medium text-[var(--color-muted-foreground)]"
            >
              Radio
            </label>
            <select
              id="filter-radius"
              className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
            >
              {RADIUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!nearMe ? (
            <Button
              type="button"
              variant="accent"
              size="sm"
              onClick={requestNearMe}
              disabled={geoLoading}
              className="gap-1.5"
            >
              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Cerca mío
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearNearMe}
            >
              Quitar cerca mío
            </Button>
          )}
        </div>
      </div>

      {geoError && (
        <p className="text-sm text-red-600" role="alert">
          {geoError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <PlacesMapClient
          places={mapPlaces}
          userLocation={nearMe ? userLocation : null}
        />

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Lista ({visible.length})
            {nearMe && " · por distancia"}
          </h2>
          {places.length === 0 ? (
            <p className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Todavía no hay locales publicados. Pronto vas a ver puntos en el
              mapa.
            </p>
          ) : visible.length === 0 ? (
            <p className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              Ningún local coincide con los filtros
              {nearMe && radiusKm > 0 ? ` en ${radiusKm} km` : ""}.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
              {visible.map(({ place, km }) => (
                <li key={place.id}>
                  <Link
                    href={`/locales/${place.slug}`}
                    className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--color-brand-cream)]"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[var(--color-brown)]">
                          {place.name}
                        </p>
                        {km != null && (
                          <span className="shrink-0 text-xs font-medium text-[var(--color-primary)]">
                            {formatDistanceKm(km)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                        {PLACE_CELIAC_LABELS[place.celiac_level]}
                      </p>
                      {(place.address || place.city) && (
                        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] line-clamp-1">
                          {[place.address, place.city]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
