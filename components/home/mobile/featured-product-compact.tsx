"use client";

import Link from "next/link";
import Image from "next/image";
import { HomeCarousel, HomeCarouselSlide } from "@/components/home/mobile/home-carousel";
import { HomeSectionHeader } from "@/components/home/mobile/home-section-header";
import { StarRating } from "@/components/product/star-rating";
import type { HomeFeaturedProduct } from "@/lib/home-server";
import { cn } from "@/lib/utils";

function excerpt(text: string | null, max = 100): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function FeaturedProductCompact({
  product,
  className,
}: {
  product: HomeFeaturedProduct;
  className?: string;
}) {
  const subtitle =
    product.featured_opinion?.trim() ||
    product.ai_summary?.trim() ||
    (product.brand_name
      ? `Evaluación de la comunidad sobre ${product.brand_name}.`
      : "El producto mejor puntuado por la comunidad.");

  return (
    <section className={cn("mb-5", className)}>
      <HomeSectionHeader
        title="Producto destacado"
        href={`/productos/${product.slug}`}
        linkLabel="Ver ficha"
      />
      <HomeCarousel>
        <HomeCarouselSlide>
          <article className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Link
                href={`/productos/${product.slug}`}
                className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[var(--color-brand-cream)] ring-2 ring-white"
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-0.5"
                    sizes="32px"
                    priority
                    unoptimized={product.image_url.includes("openfoodfacts")}
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[8px] text-[var(--color-muted-foreground)]">
                    —
                  </span>
                )}
              </Link>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-brown)]">
                  {product.name}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                  Destacado
                </span>
              </div>
            </div>
            <StarRating value={product.weighted_rating} size="sm" showValue={false} />
            <p className="mt-2 flex-1 text-sm italic leading-snug text-[var(--color-brown)] line-clamp-3">
              &ldquo;{excerpt(subtitle)}&rdquo;
            </p>
            <Link
              href={`/productos/${product.slug}`}
              className="mt-3 truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]"
            >
              {product.brand_name ? `${product.brand_name} · ` : ""}
              Ver producto
            </Link>
          </article>
        </HomeCarouselSlide>
      </HomeCarousel>
    </section>
  );
}
