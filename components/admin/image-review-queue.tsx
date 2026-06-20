"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReviewImageRow } from "@/lib/admin/catalog-server";
import type { ImageAdminAction } from "@/lib/admin/images-admin";
import { Loader2 } from "lucide-react";

const ACTION_LABELS: Record<ImageAdminAction, string> = {
  approve_cover: "Aprobar como portada",
  hide: "Ocultar",
  dismiss_review: "Descartar revisión",
};

export function ImageReviewQueue({
  initialImages,
}: {
  initialImages: ReviewImageRow[];
}) {
  const [images, setImages] = useState(initialImages);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (imageId: string, action: ImageAdminAction) => {
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
        setError(data.error ?? "No se pudo procesar.");
        return;
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch {
      setError("Error de conexión.");
    } finally {
      setActingId(null);
    }
  };

  if (images.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">
        No hay imágenes pendientes de revisión.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {images.map((img) => (
        <Card key={img.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{img.product_name}</CardTitle>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Origen: {img.image_source}
              {img.quality_score != null && ` · Score: ${img.quality_score}`}
              {img.sort_order === 0 && " · Candidata a portada"}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative aspect-square max-w-[200px] overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
              <Image
                src={img.url}
                alt={img.product_name}
                fill
                className="object-contain"
                sizes="200px"
                unoptimized
              />
            </div>

            {img.quality_details?.issues?.length ? (
              <p className="text-xs text-amber-800">
                Problemas: {img.quality_details.issues.join(", ")}
              </p>
            ) : null}

            {img.product_slug && (
              <Link
                href={`/productos/${img.product_slug}`}
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                target="_blank"
              >
                Ver producto →
              </Link>
            )}

            <div className="flex flex-wrap gap-2">
              {(["approve_cover", "dismiss_review", "hide"] as ImageAdminAction[]).map(
                (action) => (
                  <Button
                    key={action}
                    type="button"
                    size="sm"
                    variant={action === "hide" ? "ghost" : action === "approve_cover" ? "default" : "outline"}
                    disabled={actingId === img.id}
                    onClick={() => void handleAction(img.id, action)}
                  >
                    {actingId === img.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {ACTION_LABELS[action]}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
