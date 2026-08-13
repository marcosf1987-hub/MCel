"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Search } from "lucide-react";

export type PlaceLocationValue = {
  lat: number;
  lng: number;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  fillName?: boolean;
};

type NominatimHit = {
  lat: number;
  lng: number;
  displayName: string;
  name: string | null;
  address: string | null;
  city: string | null;
};

const PlacePinMap = dynamic(
  () =>
    import("@/components/admin/place-pin-map").then((m) => m.PlacePinMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-brand-cream)] text-sm text-[var(--color-muted-foreground)]">
        Cargando mapa…
      </div>
    ),
  }
);

export function PlaceLocationPicker({
  lat,
  lng,
  onChange,
  onError,
}: {
  lat: string;
  lng: string;
  onChange: (value: PlaceLocationValue) => void;
  onError: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [reversing, setReversing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const parsed = useMemo(() => {
    const la = Number(String(lat).replace(",", "."));
    const ln = Number(String(lng).replace(",", "."));
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    return { lat: la, lng: ln };
  }, [lat, lng]);

  const runSearch = async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch("/api/admin/catalog/places/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mode: "search", query: q }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        onError(data.error ?? "No se pudo buscar la dirección.");
        setResults([]);
        return;
      }
      setResults(data.results ?? []);
    } catch {
      onError("Error de conexión con el geocoder.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(value);
    }, 450);
  };

  const applyHit = (hit: NominatimHit, fillName: boolean) => {
    setResults([]);
    setQuery(hit.displayName);
    onChange({
      lat: hit.lat,
      lng: hit.lng,
      name: hit.name,
      address: hit.address,
      city: hit.city,
      fillName,
    });
  };

  const reverseFill = async (coords: { lat: number; lng: number }) => {
    setReversing(true);
    try {
      const res = await fetch("/api/admin/catalog/places/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "reverse",
          lat: coords.lat,
          lng: coords.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        // Coordenadas ya están; reverse es best-effort.
        return;
      }
      const r = data.result as NominatimHit;
      onChange({
        lat: coords.lat,
        lng: coords.lng,
        address: r.address,
        city: r.city,
        fillName: false,
      });
    } finally {
      setReversing(false);
    }
  };

  const onPinChange = (coords: { lat: number; lng: number }) => {
    onChange({ lat: coords.lat, lng: coords.lng, fillName: false });
    void reverseFill(coords);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="space-y-1.5">
        <Label htmlFor="osm-search">Buscar dirección (OpenStreetMap)</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            id="osm-search"
            className="pl-9"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Ej. Av. Corrientes 1234, CABA"
            autoComplete="off"
          />
          {(searching || reversing) && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--color-muted-foreground)]" />
          )}
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Elegí un resultado o hacé clic / arrastrá el pin en el mapa. Datos ©
          OpenStreetMap.
        </p>
      </div>

      {results.length > 0 && (
        <ul className="overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-sm">
          {results.map((hit) => (
            <li key={`${hit.lat}-${hit.lng}-${hit.displayName}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--color-brand-cream)]"
                onClick={() => applyHit(hit, Boolean(hit.name))}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <span>
                  {hit.name && (
                    <span className="block font-medium text-[var(--color-brown)]">
                      {hit.name}
                    </span>
                  )}
                  <span className="block text-xs text-[var(--color-muted-foreground)]">
                    {hit.displayName}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <PlacePinMap
        lat={parsed?.lat ?? null}
        lng={parsed?.lng ?? null}
        onChange={onPinChange}
      />

      <div className="flex flex-wrap gap-2">
        {parsed && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={reversing}
            onClick={() => void reverseFill(parsed)}
          >
            Completar dirección desde el pin
          </Button>
        )}
      </div>
    </div>
  );
}
