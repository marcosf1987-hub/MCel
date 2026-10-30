import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCardGrid } from "@/components/product/product-card-grid";
import { getProductCardAuthContext } from "@/lib/product-card-auth";
import { buildProductCards } from "@/lib/product-cards";
import { getBrandName } from "@/lib/utils";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { isLoggedIn, favoriteIds } = await getProductCardAuthContext(supabase);

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, name_es, subcategories(id, name, name_es, slug)")
    .eq("slug", slug)
    .single();

  if (!category) notFound();

  const { data: products } = await supabase
    .from("products")
    .select(
      `id, slug, name, barcode, deleted_at, weighted_rating, review_count, brands(name), product_images(url, sort_order, is_hidden)`
    )
    .eq("category_id", category.id);

  const subs = category.subcategories as { id: string; name: string; name_es: string | null; slug: string }[];

  const cards = await buildProductCards(supabase, products ?? [], getBrandName);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{category.name_es ?? category.name}</h1>
      <div className="mb-6 mt-4 flex flex-wrap gap-2">
        {subs.map((s) => (
          <Link
            key={s.id}
            href={`/subcategorias/${s.slug}?cat=${slug}`}
            className="rounded-full border px-3 py-1 text-sm hover:bg-[var(--color-muted)]"
          >
            {s.name_es ?? s.name}
          </Link>
        ))}
      </div>
      <ProductCardGrid
        products={cards}
        isLoggedIn={isLoggedIn}
        favoriteIds={favoriteIds}
      />
    </div>
  );
}
