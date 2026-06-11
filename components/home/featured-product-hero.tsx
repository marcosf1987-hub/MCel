import Link from "next/link";
import Image from "next/image";
import { Award, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/product/star-rating";
import type { HomeFeaturedProduct } from "@/lib/home-server";

function excerpt(text: string | null, max = 140): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function FeaturedProductHero({ product }: { product: HomeFeaturedProduct }) {
  const subtitle =
    product.ai_summary?.trim() ||
    (product.brand_name
      ? `Evaluación de la comunidad sobre ${product.brand_name}.`
      : "El producto mejor puntuado por la comunidad celíaca.");

  const opinion = excerpt(product.featured_opinion);
  const reviewLabel =
    product.review_count === 1 ? "1 evaluación" : `${product.review_count} evaluaciones`;

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm md:mb-12">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(220px,300px)_1fr] lg:items-center lg:gap-8 lg:p-8">
        <Link
          href={`/productos/${product.slug}`}
          className="relative mx-auto aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-xl bg-gradient-to-b from-[var(--color-brand-cream)] to-white lg:mx-0"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-5"
              sizes="(max-width: 1024px) 280px, 300px"
              priority
              unoptimized={product.image_url.includes("openfoodfacts")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              Sin foto
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-brown)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            <Award className="h-3 w-3" />
            Destacado
          </span>
        </Link>

        <div className="flex flex-col justify-center space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
              Veredicto de la comunidad
            </p>
            <h1 className="font-[family-name:var(--font-headline)] text-2xl font-bold leading-tight text-[var(--color-brown)] lg:text-3xl">
              <Link href={`/productos/${product.slug}`} className="hover:underline">
                {product.name}
              </Link>
            </h1>
            {product.brand_name && (
              <p className="text-sm font-medium text-[var(--color-muted-foreground)]">
                {product.brand_name}
              </p>
            )}
            <p className="line-clamp-3 text-sm italic leading-relaxed text-[var(--color-neutral)]">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-y border-[var(--color-border)] py-4">
            <p className="text-3xl font-bold tabular-nums text-[var(--color-primary)]">
              {product.weighted_rating?.toFixed(1) ?? "—"}
            </p>
            <div className="space-y-1">
              <StarRating value={product.weighted_rating} size="md" showValue={false} />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {reviewLabel} · puntuación ponderada
              </p>
            </div>
          </div>

          {opinion && (
            <p className="text-sm italic leading-relaxed text-[var(--color-neutral)] line-clamp-2">
              &ldquo;{opinion}&rdquo;
              {product.featured_display_name && (
                <span className="not-italic text-[var(--color-muted-foreground)]">
                  {" "}
                  — {product.featured_display_name}
                </span>
              )}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:gap-3">
            <Button
              asChild
              variant="accent"
              size="sm"
              className="w-full gap-1.5 uppercase tracking-wide sm:w-auto"
            >
              <Link href={`/productos/${product.slug}/evaluar`}>
                <ClipboardList className="h-4 w-4" />
                Valorar producto
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link href={`/productos/${product.slug}`}>Ver ficha</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
