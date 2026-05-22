"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/product/star-rating";
import { GLUTEN_LABELS, type GlutenCertification } from "@/types/database";
import { MessageSquare, PackagePlus, Pencil, Search, Trash2 } from "lucide-react";

export type CollaborationItem =
  | {
      kind: "review";
      id: string;
      date: string;
      productId: string;
      productSlug: string;
      productName: string;
      brandName?: string;
      rating: number;
      opinion: string;
      glutenCertification: GlutenCertification;
    }
  | {
      kind: "product";
      id: string;
      date: string;
      productId: string;
      productSlug: string;
      productName: string;
      brandName?: string;
    };

export function CollaborationsSection({
  items,
}: {
  items: CollaborationItem[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "review" | "product">("all");
  const [certFilter, setCertFilter] = useState<string>("all");
  const [minRating, setMinRating] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = [...items];
    if (typeFilter !== "all") {
      list = list.filter((i) => i.kind === typeFilter);
    }
    if (q.trim()) {
      const term = q.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.productName.toLowerCase().includes(term) ||
          (i.brandName?.toLowerCase().includes(term) ?? false)
      );
    }
    if (certFilter === "sin_tacc") {
      list = list.filter(
        (i) => i.kind === "review" && i.glutenCertification === "sin_tacc"
      );
    }
    if (minRating !== "all") {
      const min = Number(minRating);
      list = list.filter((i) => i.kind === "review" && i.rating >= min);
    }
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [items, q, typeFilter, certFilter, minRating]);

  const handleDeleteReview = async (reviewId: string, productSlug: string) => {
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
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <form
          className="flex flex-1 gap-2 sm:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(new FormData(e.currentTarget).get("search") as string);
          }}
        >
          <Input
            name="search"
            placeholder="Buscar colaboraciones…"
            defaultValue={q}
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="review">Evaluaciones</SelectItem>
            <SelectItem value="product">Altas de producto</SelectItem>
          </SelectContent>
        </Select>

        <Select value={certFilter} onValueChange={setCertFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Certificación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="sin_tacc">Solo SIN TACC</SelectItem>
          </SelectContent>
        </Select>

        <Select value={minRating} onValueChange={setMinRating}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Nota mínima" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier nota</SelectItem>
            <SelectItem value="3">3+ estrellas</SelectItem>
            <SelectItem value="4">4+ estrellas</SelectItem>
            <SelectItem value="5">5 estrellas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)] py-6 text-center">
          No hay colaboraciones que coincidan.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-white">
          {filtered.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                    {item.kind === "review" ? (
                      <MessageSquare className="h-3.5 w-3.5" />
                    ) : (
                      <PackagePlus className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {item.kind === "review" ? "Evaluación" : "Alta de producto"}
                    </span>
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
                  {item.kind === "review" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StarRating value={item.rating} size="sm" />
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {GLUTEN_LABELS[item.glutenCertification]}
                      </span>
                    </div>
                  )}
                  {item.kind === "review" && (
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)] line-clamp-2">
                      {item.opinion}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/productos/${item.productSlug}`}>Ver ficha</Link>
                  </Button>
                  {item.kind === "review" && (
                    <>
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
                        onClick={() => handleDeleteReview(item.id, item.productSlug)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
