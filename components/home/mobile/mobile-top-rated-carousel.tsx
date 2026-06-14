"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { HomeCarousel, HomeCarouselSlide } from "@/components/home/mobile/home-carousel";
import { HomeSectionHeader } from "@/components/home/mobile/home-section-header";
import type { HomeTopRatedProduct } from "@/lib/home-server";

function excerpt(text: string | null, max = 80): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function MobileTopRatedCarousel({
  products,
  title,
  seeAllHref = "/productos",
}: {
  products: HomeTopRatedProduct[];
  title: string;
  seeAllHref?: string;
}) {
  if (!products.length) {
    return (
      <section className="mb-8">
        <HomeSectionHeader title={title} />
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Aún no hay productos evaluados.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <HomeSectionHeader title={title} href={seeAllHref} linkLabel="Ver todo" />
      <HomeCarousel>
        {products.map((product) => (
          <HomeCarouselSlide key={product.id}>
            <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
              <Link
                href={`/productos/${product.slug}`}
                className="relative block aspect-[4/3] bg-[var(--color-brand-cream)]"
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    sizes="85vw"
                    unoptimized={product.image_url.includes("openfoodfacts")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
                    Sin foto
                  </div>
                )}
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-[family-name:var(--font-headline)] text-base font-bold leading-snug text-[var(--color-brown)]">
                    <Link href={`/productos/${product.slug}`}>{product.name}</Link>
                  </h3>
                  <span className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-[var(--color-brown)]">
                    <Star className="h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                    {product.weighted_rating?.toFixed(1) ?? "—"}
                  </span>
                </div>
                {product.featured_opinion && (
                  <p className="mt-2 line-clamp-2 text-xs italic leading-relaxed text-[var(--color-neutral)]">
                    &ldquo;{excerpt(product.featured_opinion)}&rdquo;
                  </p>
                )}
              </div>
            </article>
          </HomeCarouselSlide>
        ))}
      </HomeCarousel>
    </section>
  );
}
