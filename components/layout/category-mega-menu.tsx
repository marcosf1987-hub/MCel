"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { CategoriesNavData } from "@/lib/categories-cache";
import { categoryDisplayName } from "@/lib/categories-cache";

export function CategoryMegaMenu({ data }: { data: CategoriesNavData }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-sm font-medium text-[var(--color-neutral)] hover:text-[var(--color-accent)] transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Explorar
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 min-w-[280px] max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white py-2 shadow-xl">
          <CategoryListLinks data={data} onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

export function CategoryListLinks({
  data,
  onNavigate,
  compact = false,
}: {
  data: CategoriesNavData;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const linkClass = compact
    ? "flex items-center justify-between px-4 py-2.5 text-sm hover:bg-[var(--color-brand-cream)]"
    : "flex items-center justify-between px-4 py-2 text-sm hover:bg-[var(--color-brand-cream)]";

  return (
    <nav aria-label="Categorías">
      <Link
        href="/productos"
        className={`${linkClass} font-medium text-[var(--color-brown)]`}
        onClick={onNavigate}
      >
        <span>Todas las categorías</span>
        <span className="text-xs text-[var(--color-muted-foreground)]">
          ({data.totalProducts})
        </span>
      </Link>
      {data.categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/categorias/${cat.slug}`}
          className={linkClass}
          onClick={onNavigate}
        >
          <span>{categoryDisplayName(cat)}</span>
          <span className="text-xs text-[var(--color-muted-foreground)]">
            ({cat.product_count})
          </span>
        </Link>
      ))}
      <div className="my-1 border-t border-[var(--color-border)]" />
      <Link
        href="/marcas"
        className={`${linkClass} text-[var(--color-neutral)]`}
        onClick={onNavigate}
      >
        Ver marcas
      </Link>
    </nav>
  );
}
