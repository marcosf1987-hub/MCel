"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

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
        <Select
          value={searchParams.get("cert") ?? "all"}
          onValueChange={(v) => update("cert", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Certificación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="sin_tacc">Solo SIN TACC</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("minRating") ?? "all"}
          onValueChange={(v) => update("minRating", v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Nota mínima" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier nota</SelectItem>
            <SelectItem value="3">3+ estrellas</SelectItem>
            <SelectItem value="4">4+ estrellas</SelectItem>
            <SelectItem value="4.5">4.5+ estrellas</SelectItem>
          </SelectContent>
        </Select>

        {showSort && (
          <Select
            value={searchParams.get("sort") ?? "default"}
            onValueChange={(v) => update("sort", v === "default" ? "" : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Más evaluados</SelectItem>
              <SelectItem value="rating">Mejor puntuación</SelectItem>
              <SelectItem value="name">Nombre A-Z</SelectItem>
              <SelectItem value="reviews">Cant. evaluaciones</SelectItem>
            </SelectContent>
          </Select>
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
