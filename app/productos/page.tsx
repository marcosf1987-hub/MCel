import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/product-card";
import { Suspense } from "react";
import { ProductFilters } from "@/components/product/product-filters";

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
    minRating?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

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
  if (params.minRating) {
    query = query.gte("weighted_rating", Number(params.minRating));
  }

  const { data: products } = await query
    .order("review_count", { ascending: false })
    .limit(48);

  let filtered = products ?? [];

  if (params.cert === "sin_tacc") {
    const { data: reviewProducts } = await supabase
      .from("reviews")
      .select("product_id")
      .eq("gluten_certification", "sin_tacc");
    const ids = new Set((reviewProducts ?? []).map((r) => r.product_id));
    filtered = filtered.filter((p) => ids.has(p.id));
  }

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
      brand_name: (p.brands as { name: string }).name,
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
