"use client";

import { useState } from "react";
import Link from "next/link";
import { categoryDisplayName } from "@/lib/categories-types";
import type { CategoryWithCount } from "@/lib/categories-types";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export function ExploreCategoryAccordion({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {categories.map((cat) => {
        const expanded = expandedId === cat.id;
        const subs = cat.subcategories ?? [];

        return (
          <li key={cat.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left hover:bg-[var(--color-brand-cream)]"
              aria-expanded={expanded}
              onClick={() => toggle(cat.id)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition-transform",
                    expanded && "rotate-180"
                  )}
                />
                <span className="font-medium text-[var(--color-brown)]">
                  {categoryDisplayName(cat)}
                </span>
              </span>
              <span className="shrink-0 text-sm text-[var(--color-muted-foreground)]">
                ({cat.product_count})
              </span>
            </button>

            {expanded && (
              <ul className="border-t border-[var(--color-border)] bg-[var(--color-brand-cream)]/40 pb-1">
                <li>
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className="block px-4 py-2.5 pl-10 text-sm font-medium text-[var(--color-primary)] hover:underline"
                  >
                    Ver todos en {categoryDisplayName(cat)}
                  </Link>
                </li>
                {subs.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/subcategorias/${sub.slug}?cat=${cat.slug}`}
                      className="flex items-center justify-between gap-2 px-4 py-2.5 pl-10 text-sm text-[var(--color-brown)] hover:bg-[var(--color-brand-cream)]"
                    >
                      <span>{sub.name_es ?? sub.name}</span>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        ({sub.product_count})
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
