"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarInput } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBanner, type StatusType } from "@/components/ui/status-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReview } from "@/app/actions/products";
import { GLUTEN_LABELS, type GlutenCertification } from "@/types/database";

export function ReviewForm({
  productId,
  productSlug,
  barcode,
}: {
  productId: string;
  productSlug: string;
  barcode: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [glutenCert, setGlutenCert] = useState<GlutenCertification>("desconocido");
  const [imageName, setImageName] = useState<string | null>(null);

  const setStatus = (type: StatusType, message: string) => {
    setStatusType(type);
    setStatusMsg(message);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (rating < 1) {
      setStatus("error", "Seleccioná una puntuación de 1 a 5 estrellas.");
      return;
    }

    setLoading(true);
    setStatus("loading", "Publicando tu evaluación…");

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("productId", productId);
      formData.set("productSlug", productSlug);
      formData.set("rating", String(rating));
      formData.set("glutenCertification", glutenCert);

      const result = await submitReview(formData);

      if (!result.ok) {
        if (result.needsLogin) {
          setStatus("error", result.error);
          setTimeout(
            () => router.push(`/login?returnUrl=/productos/${productSlug}/evaluar`),
            1500
          );
          return;
        }
        setStatus("error", result.error);
        return;
      }

      setStatus("success", "¡Evaluación publicada! Redirigiendo a la ficha…");
      setTimeout(() => {
        router.push(`/productos/${result.data!.slug}`);
        router.refresh();
      }, 700);
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StatusBanner type={statusType} message={statusMsg} />

      <div>
        <Label>Código de barras</Label>
        <Input value={barcode} readOnly className="bg-[var(--color-brand-cream)]" />
      </div>

      <div>
        <Label>Puntuación (1-5) *</Label>
        <StarInput
          value={rating}
          onChange={(v) => {
            setRating(v);
            setStatus("info", `Puntuación seleccionada: ${v} estrellas`);
          }}
        />
      </div>

      <div>
        <Label htmlFor="generalDescription">Descripción general *</Label>
        <Textarea
          id="generalDescription"
          name="generalDescription"
          required
          placeholder="Textura, presentación, para qué ocasión..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="taste">Sabor</Label>
        <Input id="taste" name="taste" placeholder="¿Cómo sabe?" />
      </div>

      <div>
        <Label htmlFor="price">Precio (ARS) *</Label>
        <Input id="price" name="price" type="number" min="0" step="0.01" required />
      </div>

      <div>
        <Label htmlFor="image">Imagen del producto *</Label>
        <Input
          id="image"
          name="image"
          type="file"
          accept="image/*"
          required
          onChange={(e) => {
            const f = e.target.files?.[0];
            setImageName(f?.name ?? null);
            if (f) setStatus("info", `Foto lista para subir: ${f.name}`);
          }}
        />
        {imageName && (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{imageName}</p>
        )}
      </div>

      <div>
        <Label>Certificación gluten</Label>
        <Select value={glutenCert} onValueChange={(v) => setGlutenCert(v as GlutenCertification)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GLUTEN_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="opinion">Tu evaluación / opinión *</Label>
        <Textarea
          id="opinion"
          name="opinion"
          required
          placeholder="Contá tu experiencia completa con el producto..."
          rows={4}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Publicando…" : "Publicar evaluación"}
      </Button>
    </form>
  );
}
