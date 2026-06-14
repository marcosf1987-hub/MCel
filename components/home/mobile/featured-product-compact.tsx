import Link from "next/link";
import Image from "next/image";
import { Award } from "lucide-react";
import { StarRating } from "@/components/product/star-rating";
import type { HomeFeaturedProduct } from "@/lib/home-server";
import { cn } from "@/lib/utils";

function excerpt(text: string | null, max = 80): string {
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
    <section className={cn("-mx-4 mb-5", className)}>
      <Link
        href={`/productos/${product.slug}`}
        className="flex h-[11rem] w-full overflow-hidden bg-white"
      >
        <div className="relative w-[58%] shrink-0 bg-[var(--color-brand-cream)]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="58vw"
              priority
              unoptimized={product.image_url.includes("openfoodfacts")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
              Sin foto
            </div>
          )}
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-brown)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
            <Award className="h-2.5 w-2.5" />
            Destacado
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 px-3 py-2">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--color-brown)]">
            {product.name}
          </p>
          <StarRating value={product.weighted_rating} size="sm" showValue={false} />
          <p className="line-clamp-2 text-xs italic leading-snug text-[var(--color-brown)]">
            &ldquo;{excerpt(subtitle)}&rdquo;
          </p>
          {product.brand_name && (
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
              {product.brand_name}
            </p>
          )}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
            Ver producto
          </p>
        </div>
      </Link>
    </section>
  );
}
