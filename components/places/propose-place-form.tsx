"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WizardProgress } from "@/components/ui/wizard-progress";
import { WizardFooter } from "@/components/ui/wizard-footer";
import { StarInput } from "@/components/product/star-rating";
import {
  PlaceLocationPicker,
  type PlaceLocationValue,
} from "@/components/admin/place-location-picker";
import {
  PLACE_CELIAC_LABELS,
  PLACE_CELIAC_LEVELS_USER,
  PLACE_TYPE_LABELS,
  type PlaceCeliacLevel,
  type PlaceType,
} from "@/types/database";
import { CheckCircle2 } from "lucide-react";

const TOTAL_STEPS = 3;

const STEP_TITLES: Record<1 | 2 | 3, string> = {
  1: "Datos del local",
  2: "Ubicación",
  3: "Tu valoración",
};

const selectClass =
  "flex h-10 w-full rounded-md border border-[var(--color-border)] bg-white px-3 text-sm";

export function ProposePlaceForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [placeType, setPlaceType] = useState<PlaceType>("restaurante");
  const [celiacLevel, setCeliacLevel] =
    useState<PlaceCeliacLevel>("desconocido");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
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

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) {
        setError("Ingresá el nombre del local.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!lat || !lng) {
        setError("Marcá la ubicación en el mapa o buscá la dirección.");
        return;
      }
      setStep(3);
    }
  };

  const goBack = () => {
    setError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const submit = async () => {
    if (rating < 1) {
      setError("Seleccioná una puntuación de 1 a 5 estrellas.");
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
          description: description.trim() || null,
          celiac_level: celiacLevel,
          rating,
          opinion: description.trim() || null,
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
            <Link href="/locales">Volver al mapa</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/locales/mis-propuestas">Ver mis propuestas</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      <WizardProgress
        step={step}
        total={TOTAL_STEPS}
        title={STEP_TITLES[step]}
      />

      {step === 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Datos del local</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="prop-name">Nombre *</Label>
              <Input
                id="prop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del comercio o restaurante"
                autoFocus
              />
            </div>
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
                {PLACE_CELIAC_LEVELS_USER.map((k) => (
                  <option key={k} value={k}>
                    {PLACE_CELIAC_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ubicación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tu valoración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Estrellas *</Label>
              <StarInput value={rating} onChange={setRating} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prop-desc">Descripción (opcional)</Label>
              <Textarea
                id="prop-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Contá tu experiencia, tips para celíacos…"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <WizardFooter
        showBack={step > 1}
        onBack={goBack}
        onPrimary={step < 3 ? goNext : submit}
        primaryLabel={step < 3 ? "Continuar" : "Enviar propuesta"}
        loading={loading}
        loadingLabel="Enviando…"
      />
    </div>
  );
}
