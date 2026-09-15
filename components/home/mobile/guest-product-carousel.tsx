"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { HomeTopRatedProduct } from "@/lib/home-server";
import { IMAGE_SIZE, nextImageUnoptimized } from "@/lib/next-image";
import { cn } from "@/lib/utils";

function productTag(rating: number | null): string {
  const r = rating ?? 0;
  if (r >= 4.5) return "Imprescindible";
  if (r >= 4) return "Destacado";
  return "Popular";
}

export function GuestProductCarousel({
  products,
  title,
  subtitle,
  seeAllHref = "/productos",
  compact = false,
}: {
  products: HomeTopRatedProduct[];
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  compact?: boolean;
}) {
  if (!products.length) {
    return (
      <section className="mb-8 px-4">
        <h2 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-brown)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">{subtitle}</p>
        )}
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          Aún no hay productos evaluados.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-4">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-brown)]">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">{subtitle}</p>
          )}
        </div>
        <Link
          href={seeAllHref}
          className="shrink-0 text-xs font-bold text-[var(--color-primary)]"
        >
          Ver todo
        </Link>
      </div>
      <div className="-mx-0 flex gap-3.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/productos/${product.slug}`}
            className={cn(
              "shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm transition-transform active:scale-[0.98]",
              compact ? "w-40" : "w-[172px]"
            )}
          >
            <div
              className={cn(
                "relative bg-[var(--color-brand-cream)]",
                compact ? "h-24" : "h-28"
              )}
            >
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-contain p-2"
                  sizes={IMAGE_SIZE.card}
                  unoptimized={nextImageUnoptimized(product.image_url)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
                  —
                </div>
              )}
              {!compact && (
                <span className="absolute bottom-2 right-2 rounded-md bg-[var(--color-brand-cream)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-brown)] shadow-sm">
                  {productTag(product.weighted_rating)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 p-3">
              {product.brand_name && (
                <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {product.brand_name}
                </span>
              )}
              <h3 className="truncate text-[16px] font-bold leading-snug text-[var(--color-brown)]">
                {product.name}
              </h3>
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-0.5 font-bold text-[var(--color-primary)]">
                  <Star className="h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                  {product.weighted_rating?.toFixed(1) ?? "—"}
                </span>
                <span className="text-[13px] text-[var(--color-muted-foreground)]">
                  {product.review_count} eval.
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
