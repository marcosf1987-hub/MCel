"use client";

import { useState } from "react";
import { StarInput } from "@/components/product/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [glutenCert, setGlutenCert] = useState<GlutenCertification>("desconocido");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Seleccioná una puntuación.");
      return;
    }
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("productId", productId);
    formData.set("productSlug", productSlug);
    formData.set("rating", String(rating));
    formData.set("glutenCertification", glutenCert);

    const result = await submitReview(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Código de barras</Label>
        <Input value={barcode} readOnly className="bg-[var(--color-muted)]" />
      </div>

      <div>
        <Label>Puntuación (1-5) *</Label>
        <StarInput value={rating} onChange={setRating} />
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
        <Input id="image" name="image" type="file" accept="image/*" required />
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

      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
      <Button type="submit" disabled={loading}>
        Publicar evaluación
      </Button>
    </form>
  );
}
