"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AdminProductImageRow } from "@/lib/admin/catalog-server";
import type { ImageAdminAction } from "@/lib/admin/images-admin";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";

export function AdminProductImagesEditor({ productId }: { productId: string }) {
  const [images, setImages] = useState<AdminProductImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const coverId = useMemo(() => {
    const visible = images.filter((img) => !img.is_hidden);
    if (!visible.length) return null;
    const sorted = [...visible].sort((a, b) => a.sort_order - b.sort_order);
    return sorted[0]?.id ?? null;
  }, [images]);

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/images`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudieron cargar las imágenes.");
        return;
      }
      setImages(data.images as AdminProductImageRow[]);
    } catch {
      setError("Error de conexión al cargar imágenes.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const runAction = async (imageId: string, action: ImageAdminAction) => {
    setActingId(imageId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo actualizar la imagen.");
        return;
      }
      await loadImages();
    } catch {
      setError("Error de conexión.");
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando imágenes…
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Este producto no tiene imágenes cargadas.
      </p>
    );
  }

  const visible = images.filter((img) => !img.is_hidden);
  const hidden = images.filter((img) => img.is_hidden);

  return (
    <div className="space-y-3">
      <div>
        <Label>Imagen de portada</Label>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Elegí qué foto se muestra primero en la ficha y listados. Queda fijada
          manualmente y no la cambia el ranking automático.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((img) => {
            const isCover = img.id === coverId;
            return (
              <div
                key={img.id}
                className={cn(
                  "overflow-hidden rounded-lg border bg-white",
                  isCover
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30"
                    : "border-[var(--color-border)]"
                )}
              >
                <div className="relative aspect-square">
                  <Image
                    src={img.url}
                    alt="Imagen del producto"
                    fill
                    className="object-contain p-1"
                    sizes="160px"
                    unoptimized={img.url.includes("supabase")}
                  />
                  {isCover && (
                    <span className="absolute left-1 top-1 inline-flex items-center gap-0.5 rounded-md bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Star className="h-3 w-3 fill-current" />
                      Portada
                    </span>
                  )}
                </div>
                <div className="space-y-1 border-t border-[var(--color-border)] p-2">
                  <p className="text-[10px] text-[var(--color-muted-foreground)]">
                    {img.image_source ?? "—"}
                    {img.quality_status === "manual" && " · manual"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {!isCover && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 text-xs"
                        disabled={actingId === img.id}
                        onClick={() => void runAction(img.id, "approve_cover")}
                      >
                        {actingId === img.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          "Usar como portada"
                        )}
                      </Button>
                    )}
                    {!isCover && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-[var(--color-muted-foreground)]"
                        disabled={actingId === img.id}
                        onClick={() => void runAction(img.id, "hide")}
                      >
                        Ocultar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hidden.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-muted-foreground)]">
            Imágenes ocultas ({hidden.length})
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {hidden.map((img) => (
              <div
                key={img.id}
                className="overflow-hidden rounded-lg border border-dashed border-[var(--color-border)] bg-white opacity-70"
              >
                <div className="relative aspect-square">
                  <Image
                    src={img.url}
                    alt="Imagen oculta"
                    fill
                    className="object-contain p-1 grayscale"
                    sizes="160px"
                    unoptimized={img.url.includes("supabase")}
                  />
                </div>
                <div className="border-t border-[var(--color-border)] p-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-xs"
                    disabled={actingId === img.id}
                    onClick={() => void runAction(img.id, "approve_cover")}
                  >
                    {actingId === img.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Restaurar como portada"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
