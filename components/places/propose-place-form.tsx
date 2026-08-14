"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PlaceLocationPicker,
  type PlaceLocationValue,
} from "@/components/admin/place-location-picker";
import {
  PLACE_CELIAC_LABELS,
  PLACE_TYPE_LABELS,
  type PlaceCeliacLevel,
  type PlaceType,
} from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { CheckCircle2, Loader2 } from "lucide-react";

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-[var(--color-brown)]">{title}</h2>
      {hint && (
        <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
          {hint}
        </p>
      )}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function ProposePlaceForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [placeType, setPlaceType] = useState<PlaceType>("restaurante");
  const [celiacLevel, setCeliacLevel] =
    useState<PlaceCeliacLevel>("desconocido");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [celiacNotes, setCeliacNotes] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const applyLocation = (value: PlaceLocationValue) => {
    setLat(String(value.lat));
    setLng(String(value.lng));
    if (value.address != null) setAddress(value.address);
    if (value.city != null) setCity(value.city);
    if (value.fillName && value.name && !name.trim()) setName(value.name);
  };

  const onCoverFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sesión expirada.");
        return;
      }
      const compressed = await compressImage(file);
      const path = `${user.id}/places/${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, compressed, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (upErr) {
        setError(`No se pudo subir la foto: ${upErr.message}`);
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(path);
      setCoverUrl(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir foto.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!name.trim() || !lat || !lng) {
      setError("Nombre y ubicación son obligatorios.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/places/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          place_type: placeType,
          lat: Number(lat),
          lng: Number(lng),
          address: address || null,
          city: city || null,
          description: description || null,
          phone: phone || null,
          website: website || null,
          cover_image_url: coverUrl,
          celiac_level: celiacLevel,
          celiac_notes: celiacNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.needsLogin) {
          router.push("/login?returnUrl=/locales/nuevo");
          return;
        }
        setError(data.error ?? "No se pudo enviar la propuesta.");
        return;
      }
      setDone(true);
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-brand-cream)] px-4 py-10 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--color-accent)]" />
        <p className="mt-3 font-medium text-[var(--color-brown)]">
          ¡Gracias! Tu local quedó pendiente de revisión.
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          Te avisamos cuando un moderador lo publique o lo rechace.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild variant="accent">
            <Link href="/locales/mis-propuestas">Ver mis propuestas</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/locales">Volver al mapa</Link>
          </Button>
        </div>
      </div>
    );
  }

  const selectClass =
    "flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm";

  return (
    <div className="space-y-4 pb-24 md:pb-4">
      <Section title="Datos del local" hint="Nombre y tipo son lo primero que ven los demás.">
        <div className="space-y-1.5">
          <Label htmlFor="prop-name">Nombre *</Label>
          <Input
            id="prop-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del comercio o restaurante"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prop-type">Tipo</Label>
            <select
              id="prop-type"
              className={selectClass}
              value={placeType}
              onChange={(e) => setPlaceType(e.target.value as PlaceType)}
            >
              {(Object.keys(PLACE_TYPE_LABELS) as PlaceType[]).map((k) => (
                <option key={k} value={k}>
                  {PLACE_TYPE_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prop-celiac">Nivel celíaco</Label>
            <select
              id="prop-celiac"
              className={selectClass}
              value={celiacLevel}
              onChange={(e) =>
                setCeliacLevel(e.target.value as PlaceCeliacLevel)
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
        </div>
      </Section>

      <Section
        title="Ubicación *"
        hint="Buscá la dirección o mové el pin en el mapa."
      >
        <PlaceLocationPicker
          lat={lat}
          lng={lng}
          onChange={applyLocation}
          onError={setError}
          geocodeUrl="/api/places/geocode"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prop-address">Dirección</Label>
            <Input
              id="prop-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prop-city">Ciudad</Label>
            <Input
              id="prop-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>
      </Section>

      <Section
        title="Info celíaco"
        hint="Cuanto más concreto, más útil para la comunidad."
      >
        <div className="space-y-1.5">
          <Label htmlFor="prop-notes">Notas celíaco</Label>
          <Textarea
            id="prop-notes"
            value={celiacNotes}
            onChange={(e) => setCeliacNotes(e.target.value)}
            rows={2}
            placeholder="Cocina segregada, carta marcada, etc."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prop-desc">Descripción</Label>
          <Textarea
            id="prop-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Qué ofrece el lugar, horarios, tip…"
          />
        </div>
      </Section>

      <Section title="Contacto y foto" hint="Opcional, pero ayuda a identificarlo.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prop-phone">Teléfono</Label>
            <Input
              id="prop-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prop-web">Sitio web</Label>
            <Input
              id="prop-web"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prop-cover">Foto</Label>
          <Input
            id="prop-cover"
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => void onCoverFile(e.target.files?.[0] ?? null)}
          />
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Portada"
              className="mt-2 h-36 w-full rounded-lg object-cover"
            />
          )}
        </div>
      </Section>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur-md md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <Button
          type="button"
          variant="accent"
          className="w-full md:w-auto"
          onClick={submit}
          disabled={loading || uploading}
        >
          {(loading || uploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Enviar propuesta
        </Button>
      </div>
    </div>
  );
}
