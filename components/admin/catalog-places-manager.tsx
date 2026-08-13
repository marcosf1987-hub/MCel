"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
  type Place,
  type PlaceCeliacLevel,
  type PlaceType,
} from "@/types/database";
import { Loader2, MapPin } from "lucide-react";
import {
  PlaceLocationPicker,
  type PlaceLocationValue,
} from "@/components/admin/place-location-picker";
import {
  GooglePlaceSearch,
  type GooglePlacePrefill,
} from "@/components/admin/google-place-search";

type PlaceFormState = {
  name: string;
  place_type: PlaceType;
  lat: string;
  lng: string;
  address: string;
  city: string;
  description: string;
  phone: string;
  website: string;
  cover_image_url: string;
  google_place_id: string;
  celiac_level: PlaceCeliacLevel;
  celiac_notes: string;
};

const emptyForm = (): PlaceFormState => ({
  name: "",
  place_type: "restaurante",
  lat: "",
  lng: "",
  address: "",
  city: "",
  description: "",
  phone: "",
  website: "",
  cover_image_url: "",
  google_place_id: "",
  celiac_level: "desconocido",
  celiac_notes: "",
});

function formFromPlace(p: Place): PlaceFormState {
  return {
    name: p.name,
    place_type: p.place_type,
    lat: String(p.lat),
    lng: String(p.lng),
    address: p.address ?? "",
    city: p.city ?? "",
    description: p.description ?? "",
    phone: p.phone ?? "",
    website: p.website ?? "",
    cover_image_url: p.cover_image_url ?? "",
    google_place_id: p.google_place_id ?? "",
    celiac_level: p.celiac_level,
    celiac_notes: p.celiac_notes ?? "",
  };
}

export function CatalogPlacesManager({
  initialPlaces,
}: {
  initialPlaces: Place[];
}) {
  const [places, setPlaces] = useState(initialPlaces);
  const [form, setForm] = useState<PlaceFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof PlaceFormState>(
    key: K,
    value: PlaceFormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const reload = async () => {
    const res = await fetch("/api/admin/catalog/places", {
      credentials: "include",
    });
    const data = await res.json();
    if (data.ok) setPlaces(data.places);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const startEdit = (place: Place) => {
    setEditingId(place.id);
    setForm(formFromPlace(place));
    setError(null);
  };

  const applyGooglePlace = (place: GooglePlacePrefill) => {
    setForm((prev) => ({
      ...prev,
      name: place.name,
      place_type: place.suggestedPlaceType,
      lat: String(place.lat),
      lng: String(place.lng),
      address: place.address ?? "",
      city: place.city ?? "",
      phone: place.phone ?? "",
      website: place.website ?? "",
      cover_image_url: place.coverImageUrl ?? "",
      google_place_id: place.googlePlaceId,
    }));
    setError(null);
  };

  const applyLocation = (value: PlaceLocationValue) => {
    setForm((prev) => ({
      ...prev,
      lat: String(value.lat),
      lng: String(value.lng),
      ...(value.address != null ? { address: value.address } : {}),
      ...(value.city != null ? { city: value.city } : {}),
      ...(value.fillName && value.name
        ? { name: prev.name.trim() ? prev.name : value.name }
        : {}),
    }));
    setError(null);
  };

  const save = async () => {
    if (!form.name.trim() || !form.lat.trim() || !form.lng.trim()) {
      setError("Nombre, latitud y longitud son obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        place_type: form.place_type,
        lat: form.lat,
        lng: form.lng,
        address: form.address,
        city: form.city,
        description: form.description,
        phone: form.phone,
        website: form.website,
        cover_image_url: form.cover_image_url,
        google_place_id: form.google_place_id,
        celiac_level: form.celiac_level,
        celiac_notes: form.celiac_notes,
      };

      const res = await fetch(
        editingId
          ? `/api/admin/catalog/places/${editingId}`
          : "/api/admin/catalog/places",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      resetForm();
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const softDelete = async (id: string) => {
    if (!confirm("¿Ocultar este local?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/places/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo ocultar.");
        return;
      }
      if (editingId === id) resetForm();
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const restore = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/places/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ restore: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo restaurar.");
        return;
      }
      await reload();
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {editingId ? "Editar local" : "Alta de local"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="place-name">Nombre *</Label>
              <Input
                id="place-name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ej. Panadería Sin TACC Centro"
              />
            </div>

            <PlaceLocationPicker
              lat={form.lat}
              lng={form.lng}
              onChange={applyLocation}
              onError={(message) => setError(message)}
            />

            <div className="space-y-1.5">
              <Label htmlFor="place-type">Tipo</Label>
              <select
                id="place-type"
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                value={form.place_type}
                onChange={(e) =>
                  setField("place_type", e.target.value as PlaceType)
                }
              >
                {(Object.keys(PLACE_TYPE_LABELS) as PlaceType[]).map((k) => (
                  <option key={k} value={k}>
                    {PLACE_TYPE_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="celiac-level">Nivel celíaco</Label>
              <select
                id="celiac-level"
                className="flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm"
                value={form.celiac_level}
                onChange={(e) =>
                  setField("celiac_level", e.target.value as PlaceCeliacLevel)
                }
              >
                {(Object.keys(PLACE_CELIAC_LABELS) as PlaceCeliacLevel[]).map(
                  (k) => (
                    <option key={k} value={k}>
                      {PLACE_CELIAC_LABELS[k]}
                    </option>
                  )
                )}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-lat">Latitud *</Label>
              <Input
                id="place-lat"
                value={form.lat}
                onChange={(e) => setField("lat", e.target.value)}
                placeholder="-34.6037"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-lng">Longitud *</Label>
              <Input
                id="place-lng"
                value={form.lng}
                onChange={(e) => setField("lng", e.target.value)}
                placeholder="-58.3816"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-address">Dirección</Label>
              <Input
                id="place-address"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-city">Ciudad</Label>
              <Input
                id="place-city"
                value={form.city}
                onChange={(e) => setField("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-phone">Teléfono</Label>
              <Input
                id="place-phone"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-website">Sitio web</Label>
              <Input
                id="place-website"
                value={form.website}
                onChange={(e) => setField("website", e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="place-cover">URL imagen de portada</Label>
              <Input
                id="place-cover"
                value={form.cover_image_url}
                onChange={(e) => setField("cover_image_url", e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="place-desc">Descripción</Label>
              <Textarea
                id="place-desc"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="place-notes">Notas celíaco</Label>
              <Textarea
                id="place-notes"
                value={form.celiac_notes}
                onChange={(e) => setField("celiac_notes", e.target.value)}
                rows={2}
              />
            </div>

            <details className="sm:col-span-2 rounded-lg border border-[var(--color-border)] px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-brown)]">
                Opcional: Google Places (enriquecimiento futuro)
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Requiere billing de Google. Hoy la ubicación se resuelve con
                  OSM. Si hay API key, podés prellenar contacto/foto; el Place
                  ID queda listo para enriquecer después.
                </p>
                <GooglePlaceSearch
                  onSelect={applyGooglePlace}
                  onError={(message) => setError(message)}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="place-gpid">Google Place ID</Label>
                  <Input
                    id="place-gpid"
                    value={form.google_place_id}
                    onChange={(e) =>
                      setField("google_place_id", e.target.value)
                    }
                  />
                </div>
              </div>
            </details>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={save} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Guardar cambios" : "Crear local"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar edición
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Locales ({places.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {places.length === 0 ? (
            <p className="px-4 py-6 text-sm text-[var(--color-muted-foreground)]">
              Todavía no hay locales cargados.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {places.map((place) => (
                <li
                  key={place.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-brown)]">
                      {place.name}
                      {place.deleted_at && (
                        <span className="ml-2 text-xs font-normal text-amber-700">
                          (oculto)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {PLACE_TYPE_LABELS[place.place_type]} ·{" "}
                      {PLACE_CELIAC_LABELS[place.celiac_level]}
                      {place.city ? ` · ${place.city}` : ""}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                      <MapPin className="h-3 w-3" />
                      {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!place.deleted_at && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/locales/${place.slug}`} target="_blank">
                          Ver
                        </Link>
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startEdit(place)}
                      disabled={loading}
                    >
                      Editar
                    </Button>
                    {place.deleted_at ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => restore(place.id)}
                        disabled={loading}
                      >
                        Restaurar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => softDelete(place.id)}
                        disabled={loading}
                      >
                        Ocultar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
