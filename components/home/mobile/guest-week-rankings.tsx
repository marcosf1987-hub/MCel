import Link from "next/link";
import Image from "next/image";
import { Star, ThumbsUp, Trophy } from "lucide-react";
import type { HomeTopRatedProduct } from "@/lib/home-server";
import { cn } from "@/lib/utils";

function productBadge(rating: number | null): string {
  const r = rating ?? 0;
  if (r >= 4.5) return "Imprescindible";
  if (r >= 4) return "Destacado";
  return "Popular";
}

function recommendPct(rating: number | null): number {
  if (rating == null) return 0;
  return Math.min(100, Math.round((rating / 5) * 100));
}

export function GuestWeekRankings({
  products,
  title = "Mejores de la semana",
  subtitle = "Los favoritos elegidos por celíacos",
}: {
  products: HomeTopRatedProduct[];
  title?: string;
  subtitle?: string;
}) {
  if (!products.length) return null;

  return (
    <section className="mb-8 px-4">
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="font-[family-name:var(--font-headline)] text-2xl font-semibold text-[var(--color-brown)]">
            {title}
          </h2>
        </div>
        <p className="mt-0.5 text-[13px] text-[var(--color-muted-foreground)]">{subtitle}</p>
      </div>
      <ul className="flex flex-col gap-2.5">
        {products.map((product, index) => (
          <li key={product.id}>
            <Link
              href={`/productos/${product.slug}`}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm transition-transform active:scale-[0.99]"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-headline)] text-sm font-bold",
                  index === 0
                    ? "bg-[var(--color-primary)] text-white"
                    : "bg-[var(--color-background)] text-[var(--color-muted-foreground)]"
                )}
              >
                {index + 1}
              </span>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-brand-cream)]">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-1.5"
                    sizes="56px"
                    unoptimized={product.image_url.includes("openfoodfacts")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-muted-foreground)]">
                    —
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {product.brand_name && (
                    <span className="text-[11px] font-semibold uppercase text-[var(--color-primary)]">
                      {product.brand_name}
                    </span>
                  )}
                  {index === 0 && (
                    <span className="rounded bg-[var(--color-brand-cream)] px-1.5 text-[11px] font-medium text-[var(--color-brown)]">
                      {productBadge(product.weighted_rating)}
                    </span>
                  )}
                </div>
                <h3 className="truncate text-[16px] font-semibold text-[var(--color-brown)]">
                  {product.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-[13px] text-[var(--color-secondary-brand)]">
                  <ThumbsUp className="h-3.5 w-3.5" />
                  {recommendPct(product.weighted_rating)}% recomendado · {product.review_count}{" "}
                  {product.review_count === 1 ? "eval." : "eval."}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-xl bg-[var(--color-brand-cream)] px-2.5 py-1 text-[var(--color-primary)]">
                <Star className="h-3.5 w-3.5 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                <span className="text-sm font-bold">
                  {product.weighted_rating?.toFixed(1) ?? "—"}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
