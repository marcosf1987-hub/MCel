import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { getProductCardAuthContext } from "@/lib/product-card-auth";
import { buildProductCards } from "@/lib/product-cards";

export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isLoggedIn, favoriteIds } = await getProductCardAuthContext(supabase);

  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!brand) notFound();

  const { data: products } = await supabase
    .from("products")
    .select(
      `id, slug, name, barcode, deleted_at, weighted_rating, review_count, product_images(url, sort_order, is_hidden)`
    )
    .eq("brand_id", brand.id)
    .order("name");

  const cards = await buildProductCards(supabase, products ?? [], () => brand.name);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{brand.name}</h1>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
        {cards.length} producto{cards.length !== 1 ? "s" : ""}
      </p>
      <ProductCardGrid
        products={cards}
        isLoggedIn={isLoggedIn}
        favoriteIds={favoriteIds}
      />
    </div>
  );
}
