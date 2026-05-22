"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CertFilterSelect,
  RatingFilterSelect,
  SortFilterSelect,
} from "@/components/product/list-filter-controls";
import { Search } from "lucide-react";

export function ProductListToolbar({
  showSearch = true,
  showSort = true,
}: {
  showSearch?: boolean;
  showSort?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const cert = searchParams.get("cert") ?? "all";
  const rating = searchParams.get("rating") ?? searchParams.get("minRating") ?? "all";
  const sort = searchParams.get("sort") ?? "default";

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {showSearch && (
        <form
          className="flex flex-1 gap-2 sm:min-w-[220px] sm:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            update("q", String(fd.get("q") ?? "").trim());
          }}
        >
          <Input
            name="q"
            placeholder="Buscar en esta lista…"
            defaultValue={searchParams.get("q") ?? ""}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        <CertFilterSelect value={cert} onChange={(v) => update("cert", v)} />
        <RatingFilterSelect value={rating} onChange={(v) => update("rating", v)} />

        {showSort && (
          <SortFilterSelect
            value={sort}
            onChange={(v) => update("sort", v === "default" ? "" : v)}
          />
        )}

        {searchParams.toString() && (
          <Button variant="outline" size="sm" onClick={() => router.push(pathname)}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
