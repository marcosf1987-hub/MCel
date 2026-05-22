import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/product-card";

export default async function SubcategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cat?: string }>;
}) {
  const { slug } = await params;
  const { cat } = await searchParams;
  const supabase = await createClient();

  let subQuery = supabase
    .from("subcategories")
    .select("id, name, name_es, category_id, categories(name, name_es, slug)")
    .eq("slug", slug);

  const { data: subcategory } = await subQuery.single();
  if (!subcategory) notFound();

  const { data: products } = await supabase
    .from("products")
    .select(
      `id, slug, name, weighted_rating, review_count, brands(name), product_images(url, sort_order)`
    )
    .eq("subcategory_id", subcategory.id);

  const catInfo = subcategory.categories as { name: string; name_es: string | null; slug: string };

  const cards = (products ?? []).map((p) => {
    const images = (p.product_images as { url: string; sort_order: number }[]) ?? [];
    images.sort((a, b) => a.sort_order - b.sort_order);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      weighted_rating: p.weighted_rating,
      review_count: p.review_count,
      image_url: images[0]?.url ?? null,
      brand_name: (p.brands as { name: string } | null)?.name,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {catInfo.name_es ?? catInfo.name}
      </p>
      <h1 className="text-2xl font-bold">{subcategory.name_es ?? subcategory.name}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
