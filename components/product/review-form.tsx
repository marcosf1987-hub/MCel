"use client";

import { useRef, useState } from "react";
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
import { GLUTEN_LABELS, type GlutenCertification } from "@/types/database";
import { uploadProductImageFromBrowser } from "@/lib/upload-client";
import { Loader2, Send, Trash2 } from "lucide-react";

type ReviewInitialValues = {
  rating: number;
  generalDescription: string;
  taste: string;
  price: string;
  opinion: string;
  glutenCertification: GlutenCertification;
};

export function ReviewForm({
  productId,
  productSlug,
  barcode,
  hasExistingImages = false,
  mode = "create",
  reviewId,
  initialValues,
}: {
  productId: string;
  productSlug: string;
  barcode: string;
  hasExistingImages?: boolean;
  mode?: "create" | "edit";
  reviewId?: string;
  initialValues?: ReviewInitialValues;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = mode === "edit";

  const [rating, setRating] = useState(initialValues?.rating ?? 0);
  const [statusType, setStatusType] = useState<StatusType>("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [glutenCert, setGlutenCert] = useState<GlutenCertification>(
    initialValues?.glutenCertification ?? "desconocido"
  );
  const [imageName, setImageName] = useState<string | null>(null);

  const [generalDescription, setGeneralDescription] = useState(
    initialValues?.generalDescription ?? ""
  );
  const [taste, setTaste] = useState(initialValues?.taste ?? "");
  const [price, setPrice] = useState(initialValues?.price ?? "");
  const [opinion, setOpinion] = useState(initialValues?.opinion ?? "");

  const setStatus = (type: StatusType, message: string) => {
    setStatusType(type);
    setStatusMsg(message);
  };

  const handleDelete = async () => {
    if (!reviewId) return;
    if (
      !window.confirm("¿Eliminar tu evaluación? Esta acción no se puede deshacer.")
    ) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error", data.error ?? "No se pudo eliminar");
        return;
      }
      setStatus("success", "Evaluación eliminada.");
      setTimeout(() => {
        router.push(`/productos/${productSlug}`);
        router.refresh();
      }, 800);
    } catch (err) {
      setStatus("error", err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating < 1) {
      setStatus("error", "Seleccioná una puntuación de 1 a 5 estrellas.");
      return;
    }

    if (!generalDescription.trim()) {
      setStatus("error", "Escribí la descripción general del producto.");
      return;
    }

    if (!opinion.trim()) {
      setStatus("error", "Escribí tu opinión / evaluación.");
      return;
    }

    const priceNum = Number(price);
    if (price === "" || Number.isNaN(priceNum) || priceNum < 0) {
      setStatus("error", "Ingresá un precio válido en pesos.");
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!isEdit && !file && !hasExistingImages) {
      setStatus("error", "Subí una foto del producto.");
      return;
    }

    setLoading(true);

    try {
      if (file) {
        setStatus("loading", "Comprimiendo y subiendo foto…");
        const uploadResult = await uploadProductImageFromBrowser(productId, file);
        if ("error" in uploadResult) {
          setStatus("error", uploadResult.error);
          return;
        }
        setStatus("info", "Foto subida correctamente.");
      }

      const payload = {
        productId,
        productSlug,
        rating,
        generalDescription: generalDescription.trim(),
        taste: taste.trim(),
        price: priceNum,
        opinion: opinion.trim(),
        glutenCertification: glutenCert,
        skipImage: isEdit || (hasExistingImages && !file),
      };

      setStatus("loading", isEdit ? "Guardando cambios…" : "Guardando evaluación…");

      const url = isEdit && reviewId ? `/api/reviews/${reviewId}` : "/api/reviews";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: {
        ok?: boolean;
        error?: string;
        slug?: string;
        needsLogin?: boolean;
      };

      try {
        data = JSON.parse(text);
      } catch {
        const preview = text.slice(0, 120).replace(/\s+/g, " ");
        setStatus(
          "error",
          `Error del servidor (código ${res.status}). Detalle: ${preview}`
        );
        return;
      }

      if (!res.ok || !data.ok) {
        if (data.needsLogin) {
          setStatus("error", data.error ?? "Sesión expirada.");
          setTimeout(
            () =>
              router.push(
                `/login?returnUrl=/productos/${productSlug}/${isEdit ? "editar-evaluacion" : "evaluar"}`
              ),
            2000
          );
          return;
        }
        setStatus("error", data.error ?? `Error del servidor (${res.status})`);
        return;
      }

      setStatus(
        "success",
        isEdit
          ? "¡Cambios guardados! Abriendo la ficha…"
          : "¡Evaluación publicada correctamente! Abriendo la ficha…"
      );
      setTimeout(() => {
        router.push(`/productos/${data.slug ?? productSlug}`);
        router.refresh();
      }, 1200);
    } catch (err) {
      console.error("Review submit:", err);
      setStatus(
        "error",
        err instanceof Error ? err.message : "No se pudo conectar. Revisá tu internet."
      );
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
            setStatus("info", `Puntuación: ${v} de 5 estrellas`);
          }}
        />
      </div>

      <div>
        <Label htmlFor="generalDescription">Descripción general *</Label>
        <Textarea
          id="generalDescription"
          value={generalDescription}
          onChange={(e) => setGeneralDescription(e.target.value)}
          required
          placeholder="Textura, presentación, para qué ocasión..."
          rows={3}
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="taste">Sabor</Label>
        <Input
          id="taste"
          value={taste}
          onChange={(e) => setTaste(e.target.value)}
          placeholder="¿Cómo sabe?"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="price">Precio (ARS) *</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {!isEdit && (
        <div>
          <Label htmlFor="image">
            Foto del producto {!hasExistingImages && "*"}
          </Label>
          <Input
            ref={fileInputRef}
            id="image"
            type="file"
            accept="image/*"
            capture="environment"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              setImageName(f?.name ?? null);
              if (f) {
                setStatus(
                  "info",
                  `Foto seleccionada: ${f.name} (${Math.round(f.size / 1024)} KB)`
                );
              }
            }}
          />
          {hasExistingImages && (
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              El producto ya tiene imagen. Podés subir la tuya o publicar sin foto nueva.
            </p>
          )}
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Las fotos se comprimen automáticamente para evitar errores de tamaño.
          </p>
          {imageName && (
            <p className="mt-1 text-xs font-medium text-[var(--color-brown)]">✓ {imageName}</p>
          )}
        </div>
      )}

      {isEdit && (
        <div>
          <Label htmlFor="image">Nueva foto (opcional)</Label>
          <Input
            ref={fileInputRef}
            id="image"
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={(e) => setImageName(e.target.files?.[0]?.name ?? null)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            Si subís una foto nueva, se agrega a las imágenes del producto.
          </p>
        </div>
      )}

      <div>
        <Label>Certificación gluten</Label>
        <Select
          value={glutenCert}
          onValueChange={(v) => {
            setGlutenCert(v as GlutenCertification);
            setStatus("info", `Certificación: ${GLUTEN_LABELS[v as GlutenCertification]}`);
          }}
          disabled={loading}
        >
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
          value={opinion}
          onChange={(e) => setOpinion(e.target.value)}
          required
          placeholder="Contá tu experiencia completa con el producto..."
          rows={4}
          disabled={loading}
        />
      </div>

      <div className="sticky bottom-4 z-10 space-y-3 rounded-2xl border border-[var(--color-brand-light)] bg-white p-4 shadow-lg">
        {loading && (
          <StatusBanner type="loading" message="Enviando… No cierres esta pantalla." />
        )}
        <Button type="submit" disabled={loading} className="w-full gap-2" size="lg">
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {isEdit ? "Guardando…" : "Enviando evaluación…"}
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              {isEdit ? "Guardar cambios" : "Publicar evaluación"}
            </>
          )}
        </Button>
        {isEdit && reviewId && (
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 text-red-600 hover:text-red-700"
            disabled={loading}
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar mi evaluación
          </Button>
        )}
      </div>
    </form>
  );
}
