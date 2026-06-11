import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/product/star-rating";
import { FavoriteButton } from "@/components/product/favorite-button";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  weighted_rating: number | null;
  review_count: number;
  image_url?: string | null;
  brand_name?: string;
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
  return (
    <Link href={`/productos/${product.slug}`} className="block w-full">
      <Card className="relative w-full overflow-hidden transition-all hover:shadow-md hover:ring-2 hover:ring-[var(--color-brand-light)]">
        <div className="relative aspect-square overflow-hidden bg-[var(--color-brand-cream)]">
          {showFavorite && (
            <div className="absolute right-2 top-2 z-10">
              <FavoriteButton
                productId={product.id}
                initialFavorited={isFavorited}
                isLoggedIn={isLoggedIn}
                size="sm"
              />
            </div>
          )}
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-3"
              sizes="280px"
              unoptimized={product.image_url.includes("openfoodfacts")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted-foreground)]">
              Sin foto
            </div>
          )}
        </div>
        <CardContent className="p-4">
          {product.brand_name && (
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-accent)]">
              {product.brand_name}
            </p>
          )}
          <h3 className="font-[family-name:var(--font-headline)] font-semibold line-clamp-2 text-[var(--color-brown)]">
            {product.name}
          </h3>
          <div className="mt-2">
            <StarRating value={product.weighted_rating} size="sm" />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {product.review_count} evaluación{product.review_count !== 1 ? "es" : ""}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
