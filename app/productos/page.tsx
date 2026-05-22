import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { ProductFilters } from "@/components/product/product-filters";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { applyCatalogFilters } from "@/lib/apply-product-filters";
import { getProductCardAuthContext } from "@/lib/product-card-auth";
import { getBrandName } from "@/lib/utils";

export const metadata = { title: "Productos" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    marca?: string;
    categoria?: string;
    subcategoria?: string;
    cert?: string;
    rating?: string;
    minRating?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { isLoggedIn, favoriteIds } = await getProductCardAuthContext(supabase);

  let query = supabase
    .from("products")
    .select(
      `
      id, slug, name, weighted_rating, review_count,
      brands!inner(name, slug),
      categories!inner(slug),
      subcategories!inner(slug),
      product_images(url, sort_order)
    `
    );

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.marca) query = query.eq("brands.slug", params.marca);
  if (params.categoria) query = query.eq("categories.slug", params.categoria);
  if (params.subcategoria) query = query.eq("subcategories.slug", params.subcategoria);
  const { data: products } = await query
    .order("review_count", { ascending: false })
    .limit(48);

  const filtered = await applyCatalogFilters(
    supabase,
    products ?? [],
    params.cert,
    params.rating ?? params.minRating
  );

  const cards = filtered.map((p) => {
    const images = (p.product_images as { url: string; sort_order: number }[]) ?? [];
    images.sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      weighted_rating: p.weighted_rating,
      review_count: p.review_count,
      image_url: images[0]?.url ?? null,
      brand_name: getBrandName(p.brands),
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Productos</h1>
      <Suspense fallback={null}>
        <ProductFilters />
      </Suspense>
      {params.q && (
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
          Resultados para: {params.q}
        </p>
      )}
      {cards.length === 0 ? (
        <p className="text-[var(--color-muted-foreground)]">No se encontraron productos.</p>
      ) : (
        <ProductCardGrid
          products={cards}
          isLoggedIn={isLoggedIn}
          favoriteIds={favoriteIds}
        />
      )}
    </div>
  );
}
