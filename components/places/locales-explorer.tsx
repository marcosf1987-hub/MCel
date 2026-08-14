"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  List,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  PlusCircle,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserLocation = { lat: number; lng: number };
type MobilePane = "map" | "list";

const RADIUS_OPTIONS = [
  { value: 0, label: "Sin límite" },
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
] as const;

const selectClass =
  "flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<MobilePane>("map");
  const listItemRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const filtersActive =
    typeFilter !== "all" || celiacFilter !== "all" || nearMe;

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
        setMobilePane("list");
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

  const clearFilters = () => {
    setTypeFilter("all");
    setCeliacFilter("all");
    clearNearMe();
    setSelectedId(null);
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

  useEffect(() => {
    if (!selectedId) return;
    if (!visible.some((v) => v.place.id === selectedId)) {
      setSelectedId(null);
      return;
    }
    const el = listItemRefs.current[selectedId];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, visible]);

  const onSelectPlace = (id: string) => {
    setSelectedId(id);
    setMobilePane("map");
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="sticky top-[57px] z-30 -mx-4 border-b border-[var(--color-border)] bg-[var(--color-brand-cream)]/95 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:rounded-xl md:border md:bg-white md:px-3 md:py-3 md:backdrop-blur-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[140px] flex-1 space-y-1">
            <label
              htmlFor="filter-type"
              className="text-xs font-medium text-[var(--color-muted-foreground)]"
            >
              Tipo
            </label>
            <select
              id="filter-type"
              className={selectClass}
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
              className={selectClass}
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
                className={selectClass}
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
                className="gap-1.5"
              >
                <X className="h-4 w-4" />
                Quitar cerca
              </Button>
            )}
            {filtersActive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {geoError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {geoError}
          </p>
        )}

        {/* Toggle mobile mapa / lista */}
        <div className="mt-3 flex gap-1 rounded-lg bg-white p-1 md:hidden border border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setMobilePane("map")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors",
              mobilePane === "map"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-muted-foreground)]"
            )}
          >
            <MapIcon className="h-4 w-4" />
            Mapa
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("list")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors",
              mobilePane === "list"
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-muted-foreground)]"
            )}
          >
            <List className="h-4 w-4" />
            Lista ({visible.length})
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:items-start">
        <div
          className={cn(
            mobilePane === "map" ? "block" : "hidden md:block"
          )}
        >
          <PlacesMapClient
            places={mapPlaces}
            userLocation={nearMe ? userLocation : null}
            selectedId={selectedId}
            onSelect={onSelectPlace}
          />
          {selectedId && (
            <p className="mt-2 hidden text-xs text-[var(--color-muted-foreground)] md:block">
              Tocá un marcador o un ítem de la lista para enfocarlo.
            </p>
          )}
        </div>

        <section
          className={cn(
            mobilePane === "list" ? "block" : "hidden md:block"
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {nearMe ? "Cerca tuyo" : "Locales"} · {visible.length}
            </h2>
          </div>

          {places.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-10 text-center">
              <MapPin className="mx-auto h-8 w-8 text-[var(--color-accent)]" />
              <p className="mt-3 text-sm font-medium text-[var(--color-brown)]">
                Todavía no hay locales publicados
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                Sé el primero en proponer un comercio o restaurante.
              </p>
              <Button asChild variant="accent" size="sm" className="mt-4 gap-1.5">
                <Link href="/locales/nuevo">
                  <PlusCircle className="h-4 w-4" />
                  Proponer local
                </Link>
              </Button>
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-10 text-center">
              <p className="text-sm font-medium text-[var(--color-brown)]">
                Nada coincide con estos filtros
                {nearMe && radiusKm > 0 ? ` en ${radiusKm} km` : ""}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={clearFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <ul className="max-h-[min(70vh,560px)] divide-y divide-[var(--color-border)] overflow-y-auto overscroll-contain rounded-xl border border-[var(--color-border)] bg-white">
              {visible.map(({ place, km }) => {
                const active = selectedId === place.id;
                return (
                  <li
                    key={place.id}
                    ref={(node) => {
                      listItemRefs.current[place.id] = node;
                    }}
                  >
                    <div
                      className={cn(
                        "flex items-start gap-3 px-3 py-3 transition-colors",
                        active && "bg-[var(--color-accent-soft)]"
                      )}
                    >
                      <button
                        type="button"
                        className="mt-0.5 shrink-0 rounded-md p-1 text-[var(--color-accent)] hover:bg-white/70"
                        aria-label="Ver en mapa"
                        onClick={() => onSelectPlace(place.id)}
                      >
                        <MapPin className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/locales/${place.slug}`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-[var(--color-brown)]">
                            {place.name}
                          </p>
                          {km != null && (
                            <span className="shrink-0 text-xs font-semibold text-[var(--color-primary)]">
                              {formatDistanceKm(km)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-xs text-[var(--color-muted-foreground)]">
                          <span>
                            {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                            {PLACE_CELIAC_LABELS[place.celiac_level]}
                          </span>
                          {place.review_count > 0 &&
                            place.weighted_rating != null && (
                              <span className="inline-flex items-center gap-0.5">
                                ·{" "}
                                <Star className="h-3 w-3 fill-[var(--color-accent)] text-[var(--color-accent)]" />
                                {place.weighted_rating.toFixed(1)}
                              </span>
                            )}
                        </p>
                        {(place.address || place.city) && (
                          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] line-clamp-1">
                            {[place.address, place.city]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
