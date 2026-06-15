import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/product/favorite-button";
import type { GlutenCertification } from "@/types/database";
import { cn } from "@/lib/utils";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  weighted_rating: number | null;
  review_count: number;
  image_url?: string | null;
  brand_name?: string;
  gluten_certification?: GlutenCertification;
}

function getProductBadge(
  product: ProductCardData
): { label: string; className: string } | null {
  if (product.gluten_certification === "sin_tacc") {
    return {
      label: "Sin TACC",
      className: "bg-emerald-700 text-white",
    };
  }
  if (product.gluten_certification === "sin_gluten") {
    return {
      label: "Sin gluten",
      className: "bg-emerald-600 text-white",
    };
  }
  if ((product.weighted_rating ?? 0) >= 4 && product.review_count >= 3) {
    return {
      label: "Destacado",
      className: "bg-[var(--color-primary)] text-white",
    };
  }
  return null;
}

export function ProductCard({
  product,
  isLoggedIn = false,
  isFavorited = false,
  showFavorite = true,
}: {
  product: ProductCardData;
  isLoggedIn?: boolean;
  isFavorited?: boolean;
  showFavorite?: boolean;
}) {
  const badge = getProductBadge(product);
  const ratingLabel = product.weighted_rating?.toFixed(1) ?? "—";

  return (
    <Card className="flex h-full flex-col overflow-hidden border-[var(--color-border)] bg-white shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-[var(--color-brand-light)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-brand-cream)]">
        <Link href={`/productos/${product.slug}`} className="absolute inset-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-3"
              sizes="(max-width: 640px) 50vw, 25vw"
              unoptimized={product.image_url.includes("openfoodfacts")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted-foreground)]">
              Sin foto
            </div>
          )}
        </Link>
        {badge && (
          <span
            className={cn(
              "absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm",
              badge.className
            )}
          >
            {badge.label}
          </span>
        )}
        {showFavorite && (
          <div className="absolute right-1.5 top-1.5 z-10">
            <FavoriteButton
              productId={product.id}
              initialFavorited={isFavorited}
              isLoggedIn={isLoggedIn}
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        {product.brand_name && (
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {product.brand_name}
          </p>
        )}
        <h3 className="mt-0.5 font-[family-name:var(--font-headline)] text-sm font-semibold leading-snug text-[var(--color-brown)] line-clamp-2">
          <Link href={`/productos/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>

        <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-brown)]">
          <Star className="h-3.5 w-3.5 shrink-0 fill-[var(--color-primary)] text-[var(--color-primary)]" />
          <span className="font-semibold tabular-nums">{ratingLabel}</span>
          <span className="text-[var(--color-muted-foreground)]">
            ({product.review_count})
          </span>
        </div>

        <div className="mt-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-[11px] font-semibold uppercase tracking-wide"
          >
            <Link href={`/productos/${product.slug}/evaluar`}>Valorar</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
