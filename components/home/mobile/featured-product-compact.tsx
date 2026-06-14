import Link from "next/link";
import Image from "next/image";
import { Award, ChevronRight } from "lucide-react";
import { StarRating } from "@/components/product/star-rating";
import type { HomeFeaturedProduct } from "@/lib/home-server";

export function FeaturedProductCompact({ product }: { product: HomeFeaturedProduct }) {
  return (
    <section className="mb-6">
      <Link
        href={`/productos/${product.slug}`}
        className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-sm active:bg-[var(--color-brand-cream)]"
      >
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--color-brand-cream)]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-1.5"
              sizes="64px"
              priority
              unoptimized={product.image_url.includes("openfoodfacts")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-muted-foreground)]">
              Sin foto
            </div>
          )}
          <span className="absolute left-0.5 top-0.5 rounded bg-[var(--color-brown)] p-0.5 text-white">
            <Award className="h-2.5 w-2.5" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-primary)]">
            Destacado
          </p>
          <h2 className="truncate font-[family-name:var(--font-headline)] text-base font-bold text-[var(--color-brown)]">
            {product.name}
          </h2>
          {product.brand_name && (
            <p className="truncate text-xs text-[var(--color-muted-foreground)]">
              {product.brand_name}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {product.weighted_rating?.toFixed(1) ?? "—"}
            </span>
            <StarRating value={product.weighted_rating} size="sm" showValue={false} />
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
      </Link>
    </section>
  );
}
