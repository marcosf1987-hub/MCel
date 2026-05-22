"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/productos?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-wrap gap-2">
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

      {searchParams.toString() && (
        <Button variant="outline" size="sm" onClick={() => router.push("/productos")}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
