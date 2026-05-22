"use client";

import { useMemo, useState } from "react";
import { ReviewCard, type ReviewCardData } from "@/components/product/review-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption =
  | "rating-desc"
  | "rating-asc"
  | "date-desc"
  | "date-asc";

export function ReviewsList({ reviews }: { reviews: ReviewCardData[] }) {
  const [sort, setSort] = useState<SortOption>("date-desc");

  const sorted = useMemo(() => {
    const copy = [...reviews];
    switch (sort) {
      case "rating-desc":
        return copy.sort((a, b) => b.rating - a.rating);
      case "rating-asc":
        return copy.sort((a, b) => a.rating - b.rating);
      case "date-asc":
        return copy.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      default:
        return copy.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [reviews, sort]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {reviews.length} evaluación{reviews.length !== 1 ? "es" : ""}
        </h2>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Más recientes</SelectItem>
            <SelectItem value="date-asc">Más antiguas</SelectItem>
            <SelectItem value="rating-desc">Mayor puntuación</SelectItem>
            <SelectItem value="rating-asc">Menor puntuación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        {sorted.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}
