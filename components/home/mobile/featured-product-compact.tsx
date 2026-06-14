import Link from "next/link";
import Image from "next/image";
import { Award } from "lucide-react";
import { StarRating } from "@/components/product/star-rating";
import { HomeSectionHeader } from "@/components/home/mobile/home-section-header";
import type { HomeFeaturedProduct } from "@/lib/home-server";

function excerpt(text: string | null, max = 100): string {
  if (!text?.trim()) return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function FeaturedProductCompact({ product }: { product: HomeFeaturedProduct }) {
  const subtitle =
    product.featured_opinion?.trim() ||
    product.ai_summary?.trim() ||
    (product.brand_name
      ? `Evaluación de la comunidad sobre ${product.brand_name}.`
      : null);

  const reviewLabel =
    product.review_count === 1 ? "1 evaluación" : `${product.review_count} evaluaciones`;

  return (
    <section className="mb-8">
      <HomeSectionHeader
        title="Producto destacado"
        href={`/productos/${product.slug}`}
        linkLabel="Ver ficha"
      />
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
              sizes="100vw"
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

        <div className="p-4">
          <h2 className="font-[family-name:var(--font-headline)] text-base font-bold leading-snug text-[var(--color-brown)]">
            <Link href={`/productos/${product.slug}`} className="hover:underline">
              {product.name}
            </Link>
          </h2>
          {product.brand_name && (
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {product.brand_name}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {product.weighted_rating?.toFixed(1) ?? "—"}
            </span>
            <StarRating value={product.weighted_rating} size="sm" showValue={false} />
            <span className="text-xs text-[var(--color-muted-foreground)]">{reviewLabel}</span>
          </div>
          {subtitle && (
            <p className="mt-2 line-clamp-3 text-sm italic leading-snug text-[var(--color-brown)]">
              &ldquo;{excerpt(subtitle)}&rdquo;
            </p>
          )}
          <Link
            href={`/productos/${product.slug}/evaluar`}
            className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]"
          >
            Valorar este producto
          </Link>
        </div>
      </article>
    </section>
  );
}
