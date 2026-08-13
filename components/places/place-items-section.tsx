"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PlaceItem } from "@/types/database";
import { Loader2 } from "lucide-react";

export function PlaceItemsSection({
  placeId,
  placeSlug,
  initialItems,
  isLoggedIn,
}: {
  placeId: string;
  placeSlug: string;
  initialItems: PlaceItem[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingItemId, setRatingItemId] = useState<string | null>(null);
  const [itemRating, setItemRating] = useState(5);
  const [itemOpinion, setItemOpinion] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  const addItem = async () => {
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=/locales/${placeSlug}`);
      return;
    }
    if (!name.trim()) {
      setError("Nombre requerido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/places/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          placeId,
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo agregar.");
        return;
      }
      setItems((prev) => [...prev, data.item].sort((a, b) =>
        a.name.localeCompare(b.name, "es")
      ));
      setName("");
      setDescription("");
    } catch {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const rateItem = async (placeItemId: string) => {
    if (!isLoggedIn) {
      router.push(`/login?returnUrl=/locales/${placeSlug}`);
      return;
    }
    setRatingLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/places/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mode: "review",
          placeItemId,
          rating: itemRating,
          opinion: itemOpinion.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "No se pudo evaluar.");
        return;
      }
      setRatingItemId(null);
      setItemOpinion("");
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setRatingLoading(false);
    }
  };

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-brown)]">
        Carta / productos del local
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        Platos o productos que se consiguen en este lugar (no son el catálogo
        envasado de CeliApp).
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Todavía no hay ítems cargados.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-white">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[var(--color-brown)]">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {item.description}
                    </p>
                  )}
                  {item.review_count > 0 && (
                    <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                      {item.weighted_rating?.toFixed(1) ?? "—"}/5 ·{" "}
                      {item.review_count} valoración
                      {item.review_count !== 1 ? "es" : ""}
                    </p>
                  )}
                </div>
                {isLoggedIn && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRatingItemId(
                        ratingItemId === item.id ? null : item.id
                      )
                    }
                  >
                    Valorar
                  </Button>
                )}
              </div>
              {ratingItemId === item.id && (
                <div className="mt-2 space-y-2 rounded-lg bg-[var(--color-brand-cream)] p-3">
                  <Label>Puntuación (1–5)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={itemRating}
                    onChange={(e) => setItemRating(Number(e.target.value))}
                  />
                  <Textarea
                    placeholder="Comentario opcional"
                    value={itemOpinion}
                    onChange={(e) => setItemOpinion(e.target.value)}
                    rows={2}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={ratingLoading}
                    onClick={() => void rateItem(item.id)}
                  >
                    {ratingLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 space-y-3">
        <p className="text-sm font-medium text-[var(--color-brown)]">
          Agregar ítem
        </p>
        {!isLoggedIn ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            <Link
              href={`/login?returnUrl=/locales/${placeSlug}`}
              className="font-medium text-[var(--color-primary)] hover:underline"
            >
              Iniciá sesión
            </Link>{" "}
            para sumar un plato o producto.
          </p>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Nombre</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Prepizza de mozzarella"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="item-desc">Descripción</Label>
              <Textarea
                id="item-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="button" onClick={addItem} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
