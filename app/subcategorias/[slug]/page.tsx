import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { getProductCardAuthContext } from "@/lib/product-card-auth";
import { buildProductCards } from "@/lib/product-cards";
import { getBrandName, getRelation } from "@/lib/utils";

export default async function SubcategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isLoggedIn, favoriteIds } = await getProductCardAuthContext(supabase);

  const { data: subcategory } = await supabase
    .from("subcategories")
    .select("id, name, name_es, category_id, categories(name, name_es, slug)")
    .eq("slug", slug)
    .single();
  if (!subcategory) notFound();

  const { data: products } = await supabase
    .from("products")
    .select(
      `id, slug, name, weighted_rating, review_count, brands(name), product_images(url, sort_order, is_hidden)`
    )
    .eq("subcategory_id", subcategory.id);

  const catInfo = getRelation<{
    name: string;
    name_es: string | null;
    slug: string;
  }>(subcategory.categories);

  const cards = await buildProductCards(supabase, products ?? [], getBrandName);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {catInfo && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {catInfo.name_es ?? catInfo.name}
        </p>
      )}
      <h1 className="text-2xl font-bold">{subcategory.name_es ?? subcategory.name}</h1>
      <div className="mt-6">
        <ProductCardGrid
          products={cards}
          isLoggedIn={isLoggedIn}
          favoriteIds={favoriteIds}
        />
      </div>
    </div>
  );
}
