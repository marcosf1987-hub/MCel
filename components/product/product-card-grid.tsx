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
    <div className="flex flex-wrap justify-center gap-4">
      {products.map((p) => (
        <div key={p.id} className="w-full max-w-[280px] sm:w-[280px]">
          <ProductCard
            product={p}
            isLoggedIn={isLoggedIn}
            isFavorited={favoriteIds.has(p.id)}
            showFavorite
          />
        </div>
      ))}
    </div>
  );
}
