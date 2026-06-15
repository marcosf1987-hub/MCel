import { ProductCard, type ProductCardData } from "@/components/product/product-card";

export function ProductCardGrid({
  products,
  isLoggedIn = false,
  favoriteIds = new Set<string>(),
}: {
  products: ProductCardData[];
  isLoggedIn?: boolean;
  favoriteIds?: Set<string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          isLoggedIn={isLoggedIn}
          isFavorited={favoriteIds.has(p.id)}
          showFavorite
        />
      ))}
    </div>
  );
}
