"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";

export type GooglePlacePrefill = {
  googlePlaceId: string;
  name: string;
  address: string | null;
  city: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  coverImageUrl: string | null;
  suggestedPlaceType: "comercio" | "restaurante";
  photoAttribution: string | null;
};

type Suggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
};

export function GooglePlaceSearch({
  onSelect,
  onError,
}: {
  onSelect: (place: GooglePlacePrefill) => void;
  onError: (message: string) => void;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [sessionToken, setSessionToken] = useState<string>("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "/api/admin/catalog/places/google/autocomplete",
          { credentials: "include" }
        );
        const data = await res.json();
        if (cancelled) return;
        if (data.ok) {
          setConfigured(Boolean(data.configured));
          if (data.sessionToken) setSessionToken(data.sessionToken);
        } else {
          setConfigured(false);
        }
      } catch {
        if (!cancelled) setConfigured(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSearch = useCallback(
    async (input: string, token: string) => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(
          "/api/admin/catalog/places/google/autocomplete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ input, sessionToken: token }),
          }
        );
        const data = await res.json();
        if (!res.ok || !data.ok) {
          onError(data.error ?? "No se pudo buscar en Google Places.");
          setSuggestions([]);
          return;
        }
        if (data.sessionToken) setSessionToken(data.sessionToken);
        setSuggestions(data.suggestions ?? []);
      } catch {
        onError("Error de conexión con Google Places.");
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    },
    [onError]
  );

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!configured) return;
    debounceRef.current = setTimeout(() => {
      void runSearch(value, sessionToken);
    }, 350);
  };

  const pickSuggestion = async (suggestion: Suggestion) => {
    setLoadingDetails(true);
    setSuggestions([]);
    setQuery(suggestion.mainText || suggestion.fullText);
    try {
      const res = await fetch("/api/admin/catalog/places/google/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          placeId: suggestion.placeId,
          sessionToken,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        onError(data.error ?? "No se pudieron cargar los detalles.");
        return;
      }
      onSelect(data.place as GooglePlacePrefill);
      // Nueva sesión para la próxima búsqueda (billing session cerrado).
      const tokenRes = await fetch(
        "/api/admin/catalog/places/google/autocomplete",
        { credentials: "include" }
      );
      const tokenData = await tokenRes.json();
      if (tokenData.ok && tokenData.sessionToken) {
        setSessionToken(tokenData.sessionToken);
      }
    } catch {
      onError("Error al cargar el lugar de Google.");
    } finally {
      setLoadingDetails(false);
    }
  };

  if (configured === null) {
    return (
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Comprobando Google Places…
      </p>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        <p className="font-medium">Google Places no configurado</p>
        <p className="mt-1 text-xs">
          Falta la variable de entorno{" "}
          <code className="rounded bg-white/70 px-1">GOOGLE_PLACES_API_KEY</code>
          . Podés seguir cargando locales a mano. Ver instrucciones en el chat /
          README.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <Label htmlFor="google-place-search">Buscar en Google Places</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
        <Input
          id="google-place-search"
          className="pl-9"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Ej. panadería sin tacc Palermo"
          autoComplete="off"
          disabled={loadingDetails}
        />
        {(searching || loadingDetails) && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--color-muted-foreground)]" />
        )}
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Elegí un resultado para prellenar nombre, dirección, coords, contacto y
        foto. Después completá el nivel celíaco y guardá.
      </p>
      {suggestions.length > 0 && (
        <ul className="overflow-hidden rounded-md border border-[var(--color-border)] bg-white shadow-sm">
          {suggestions.map((s) => (
            <li key={s.placeId}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm hover:bg-[var(--color-brand-cream)]"
                onClick={() => void pickSuggestion(s)}
                disabled={loadingDetails}
              >
                <span className="block font-medium text-[var(--color-brown)]">
                  {s.mainText || s.fullText}
                </span>
                {s.secondaryText && (
                  <span className="block text-xs text-[var(--color-muted-foreground)]">
                    {s.secondaryText}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
