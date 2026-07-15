"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProductImagePicker } from "@/components/product/product-image-picker";
import type { AdminProductImageRow } from "@/lib/admin/catalog-server";
import type { ImageAdminAction } from "@/lib/admin/images-admin";
import { uploadProductImageFromBrowser } from "@/lib/upload-client";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";

export function AdminProductImagesEditor({ productId }: { productId: string }) {
  const [images, setImages] = useState<AdminProductImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageName, setImageName] = useState<string | null>(null);
  const [asCover, setAsCover] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    setSuccess(null);
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

  const handleUpload = async (file: File | null) => {
    if (!file) {
      setImageName(null);
      return;
    }
    setImageName(file.name);
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await uploadProductImageFromBrowser(productId, file, {
        official: true,
        asCover,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSuccess(asCover ? "Imagen subida y fijada como portada." : "Imagen subida.");
      setImageName(null);
      await loadImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
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

  const visible = images.filter((img) => !img.is_hidden);
  const hidden = images.filter((img) => img.is_hidden);

  return (
    <div className="space-y-3">
      <div>
        <Label>Imágenes del producto</Label>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          Subí una foto oficial o elegí cuál se muestra primero (portada). Las
          portadas manuales no las cambia el ranking automático.
        </p>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </p>
      )}

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-3 space-y-3">
        <ProductImagePicker
          label="Subir imagen"
          disabled={uploading}
          imageName={imageName}
          hint="Se comprime automáticamente. Queda marcada como oficial."
          onSelect={(file) => void handleUpload(file)}
        />
        <label className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
          <input
            type="checkbox"
            checked={asCover}
            disabled={uploading}
            onChange={(e) => setAsCover(e.target.checked)}
          />
          Usar como portada al subir
        </label>
        {uploading && (
          <p className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Subiendo…
          </p>
        )}
      </div>

      {images.length === 0 && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Este producto todavía no tiene imágenes. Subí una arriba.
        </p>
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
