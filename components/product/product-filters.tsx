"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CertFilterSelect,
  RatingFilterSelect,
} from "@/components/product/list-filter-controls";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`/productos?${params.toString()}`);
  };

  const cert = searchParams.get("cert") ?? "all";
  const rating = searchParams.get("rating") ?? searchParams.get("minRating") ?? "all";

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      <CertFilterSelect value={cert} onChange={(v) => update("cert", v)} />
      <RatingFilterSelect value={rating} onChange={(v) => update("rating", v)} />

      {searchParams.toString() && (
        <Button variant="outline" size="sm" onClick={() => router.push("/productos")}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
