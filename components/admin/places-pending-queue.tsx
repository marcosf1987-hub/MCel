"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Place } from "@/types/database";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
} from "@/types/database";
import { Loader2, MapPin } from "lucide-react";

export function PlacesPendingQueue({
  initialPlaces,
}: {
  initialPlaces: Place[];
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const reload = async () => {
    const res = await fetch("/api/admin/places/pending", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.ok) setPlaces(data.places);
  };

  const act = async (id: string, action: "publish" | "reject") => {
    setActingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/places/pending/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action,
          rejection_note: rejectNotes[id] ?? "",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo completar la acción.");
        return;
      }
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setActingId(null);
    }
  };

  if (places.length === 0) {
    return (
      <p className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No hay locales pendientes de revisión.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <ul className="space-y-4">
        {places.map((place) => (
          <li
            key={place.id}
            className="rounded-xl border border-[var(--color-border)] bg-white p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[var(--color-brown)]">
                  {place.name}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                  {PLACE_CELIAC_LABELS[place.celiac_level]}
                  {place.city ? ` · ${place.city}` : ""}
                </p>
                {(place.address || place.celiac_notes) && (
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {place.address}
                    {place.celiac_notes ? ` — ${place.celiac_notes}` : ""}
                  </p>
                )}
                <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                  <MapPin className="h-3 w-3" />
                  {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                </p>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link
                  href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=17/${place.lat}/${place.lng}`}
                  target="_blank"
                >
                  Ver en OSM
                </Link>
              </Button>
            </div>

            {place.cover_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={place.cover_image_url}
                alt=""
                className="mt-3 h-36 w-full rounded-lg object-cover"
              />
            )}

            <div className="mt-3 space-y-2">
              <Input
                placeholder="Motivo si rechazás…"
                value={rejectNotes[place.id] ?? ""}
                onChange={(e) =>
                  setRejectNotes((prev) => ({
                    ...prev,
                    [place.id]: e.target.value,
                  }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={actingId === place.id}
                  onClick={() => void act(place.id, "publish")}
                >
                  {actingId === place.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Publicar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={actingId === place.id}
                  onClick={() => void act(place.id, "reject")}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
