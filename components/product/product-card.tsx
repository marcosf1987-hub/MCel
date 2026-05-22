import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/product/star-rating";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  weighted_rating: number | null;
  review_count: number;
  image_url?: string | null;
  brand_name?: string;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/productos/${product.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-[var(--color-muted)]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-2"
              sizes="200px"
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
            <p className="text-xs text-[var(--color-muted-foreground)]">{product.brand_name}</p>
          )}
          <h3 className="font-medium line-clamp-2">{product.name}</h3>
          <div className="mt-2">
            <StarRating value={product.weighted_rating} size="sm" />
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
              {product.review_count} evaluación{product.review_count !== 1 ? "es" : ""}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
