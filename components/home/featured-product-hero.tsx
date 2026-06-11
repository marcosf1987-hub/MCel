import Link from "next/link";
import Image from "next/image";
import { Award, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/product/star-rating";
import type { HomeFeaturedProduct } from "@/lib/home-server";

export function FeaturedProductHero({ product }: { product: HomeFeaturedProduct }) {
  const subtitle =
    product.ai_summary?.trim() ||
    (product.brand_name
      ? `Evaluación de la comunidad sobre ${product.brand_name}.`
      : "El producto mejor puntuado por la comunidad celíaca.");

  const recommendPct = product.rating_breakdown.mustTry;

  return (
    <section className="mb-10 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-sm">
      <div className="grid max-h-[min(320px,42vh)] min-h-[220px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Link
          href={`/productos/${product.slug}`}
          className="relative min-h-[180px] bg-[var(--color-brand-cream)] lg:min-h-0"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-4"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              unoptimized={product.image_url.includes("openfoodfacts")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              Sin foto
            </div>
          )}
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-[var(--color-brown)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            <Award className="h-3 w-3" />
            Destacado
          </span>
        </Link>

        <div className="flex flex-col justify-center px-5 py-5 lg:px-6 lg:py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
            Veredicto de la comunidad
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-headline)] text-xl font-bold leading-tight text-[var(--color-brown)] lg:text-2xl">
            <Link href={`/productos/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h1>
          <p className="mt-1 line-clamp-2 text-xs italic leading-snug text-[var(--color-neutral)] lg:text-sm">
            {subtitle}
          </p>

          <div className="mt-3 rounded-xl bg-[var(--color-muted)] px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-2xl font-bold text-[var(--color-primary)]">
                {product.weighted_rating?.toFixed(1) ?? "—"}
              </p>
              <div>
                <StarRating
                  value={product.weighted_rating}
                  size="sm"
                  showValue={false}
                />
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                  Imprescindible · {recommendPct}% comunidad
                </p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-center text-[9px] font-semibold uppercase">
              <span className="rounded-md bg-white px-1 py-1 text-[var(--color-neutral)]">
                {product.rating_breakdown.mustTry}% top
              </span>
              <span className="rounded-md bg-white px-1 py-1 text-[var(--color-neutral)]">
                {product.rating_breakdown.worthTry}% ok
              </span>
              <span className="rounded-md bg-white px-1 py-1 text-[var(--color-neutral)]">
                {product.rating_breakdown.notForMe}% no
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild variant="accent" size="sm" className="gap-1.5 uppercase tracking-wide">
              <Link href={`/productos/${product.slug}/evaluar`}>
                <ClipboardList className="h-4 w-4" />
                Valorar producto
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/productos/${product.slug}`}>Ver ficha</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
