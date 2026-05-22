"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CertFilterSelect,
  RatingFilterSelect,
  SortFilterSelect,
} from "@/components/product/list-filter-controls";
import { StarRating } from "@/components/product/star-rating";
import { GLUTEN_LABELS, type GlutenCertification } from "@/types/database";
import { MessageSquare, Pencil, Search, Trash2 } from "lucide-react";

export type CollaborationItem = {
  id: string;
  date: string;
  productId: string;
  productSlug: string;
  productName: string;
  brandName?: string;
  rating: number;
  opinion: string;
  glutenCertification: GlutenCertification;
  productReviewCount: number;
  productWeightedRating: number | null;
};

export function CollaborationsSection({
  items,
}: {
  items: CollaborationItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("colabQ") ?? "");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const cert = searchParams.get("cert") ?? "all";
  const rating = searchParams.get("rating") ?? "all";
  const sort = searchParams.get("sort") ?? "default";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`/cuenta/preferencias?${params.toString()}`);
  };

  const filtered = useMemo(() => {
    let list = [...items];

    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.productName.toLowerCase().includes(term) ||
          (i.brandName?.toLowerCase().includes(term) ?? false)
      );
    }

    if (cert !== "all") {
      list = list.filter((i) => i.glutenCertification === cert);
    }

    if (rating !== "all") {
      const stars = Number(rating);
      list = list.filter((i) => i.rating === stars);
    }

    if (sort === "name") {
      list.sort((a, b) => a.productName.localeCompare(b.productName, "es"));
    } else if (sort === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sort === "reviews" || sort === "default" || !sort) {
      list.sort((a, b) => b.productReviewCount - a.productReviewCount);
    } else {
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return list;
  }, [items, q, cert, rating, sort]);

  const handleDeleteReview = async (reviewId: string) => {
    if (
      !window.confirm(
        "¿Eliminar tu evaluación? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        window.alert(data.error ?? "No se pudo eliminar");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Error de conexión");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <form
          className="flex flex-1 gap-2 sm:min-w-[220px] sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(String(new FormData(e.currentTarget).get("search") ?? "").trim());
          }}
        >
          <Input
            name="search"
            placeholder="Buscar colaboraciones…"
            defaultValue={q}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <CertFilterSelect value={cert} onChange={(v) => updateParam("cert", v)} />
        <RatingFilterSelect value={rating} onChange={(v) => updateParam("rating", v)} />
        <SortFilterSelect
          value={sort}
          onChange={(v) => updateParam("sort", v === "default" ? "" : v)}
        />

        {(searchParams.toString() || q) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setQ("");
              router.push("/cuenta/preferencias");
            }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
          No hay evaluaciones que coincidan.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-white">
          {filtered.map((item) => (
            <li key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Evaluación</span>
                    <span>·</span>
                    <time dateTime={item.date}>
                      {new Date(item.date).toLocaleDateString("es-AR")}
                    </time>
                  </div>
                  <Link
                    href={`/productos/${item.productSlug}`}
                    className="mt-1 block font-semibold text-[var(--color-brown)] hover:underline"
                  >
                    {item.productName}
                  </Link>
                  {item.brandName && (
                    <p className="text-xs text-[var(--color-accent)]">{item.brandName}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StarRating value={item.rating} size="sm" />
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {GLUTEN_LABELS[item.glutenCertification]}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
                    {item.opinion}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/productos/${item.productSlug}`}>Ver ficha</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/productos/${item.productSlug}/editar-evaluacion`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    disabled={deletingId === item.id}
                    onClick={() => handleDeleteReview(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
