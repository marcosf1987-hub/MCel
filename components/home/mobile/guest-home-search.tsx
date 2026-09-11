"use client";

import Link from "next/link";
import { QrCode } from "lucide-react";
import { SearchBar } from "@/components/layout/search-bar";

/** Búsqueda del home guest + acceso rápido al escáner. */
export function GuestHomeSearch() {
  return (
    <div className="relative w-full">
      <SearchBar placeholder="Buscá marcas, alfajores, snacks..." />
      <Link
        href="/productos/nuevo"
        aria-label="Escanear código de barras"
        className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-[var(--color-brand-light)] text-[var(--color-primary)] transition-transform active:scale-95"
      >
        <QrCode className="h-5 w-5" />
      </Link>
    </div>
  );
}
