import type { SupabaseClient } from "@supabase/supabase-js";

export type ProductListParams = {
  q?: string;
  marca?: string;
  categoria?: string;
  subcategoria?: string;
  cert?: string;
  minRating?: string;
  sort?: string;
};

export type ProductRowForCard = {
  id: string;
  slug: string;
  name: string;
  weighted_rating: number | null;
  review_count: number;
  product_images?: { url: string; sort_order: number }[] | null;
  brands?: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
  categories?: { slug: string } | { slug: string }[] | null;
  subcategories?: { slug: string } | { slug: string }[] | null;
};

const PRODUCT_SELECT = `
  id, slug, name, weighted_rating, review_count,
  brands!inner(name, slug),
  categories!inner(slug),
  subcategories!inner(slug),
  product_images(url, sort_order)
`;

export async function fetchFilteredProducts(
  supabase: SupabaseClient,
  productIds: string[] | null,
  params: ProductListParams,
  defaultOrder: { column: string; ascending: boolean } = {
    column: "review_count",
    ascending: false,
  }
): Promise<ProductRowForCard[]> {
  if (productIds !== null && productIds.length === 0) {
    return [];
  }

  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (productIds !== null) {
    query = query.in("id", productIds);
  }

  if (params.q) query = query.ilike("name", `%${params.q}%`);
  if (params.marca) query = query.eq("brands.slug", params.marca);
  if (params.categoria) query = query.eq("categories.slug", params.categoria);
  if (params.subcategoria) query = query.eq("subcategories.slug", params.subcategoria);
  if (params.minRating) {
    query = query.gte("weighted_rating", Number(params.minRating));
  }

  const sort = params.sort ?? "default";
  if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (sort === "rating") {
    query = query.order("weighted_rating", { ascending: false, nullsFirst: false });
  } else if (sort === "reviews") {
    query = query.order("review_count", { ascending: false });
  } else {
    query = query.order(defaultOrder.column, { ascending: defaultOrder.ascending });
  }

  const limit = productIds === null ? 48 : Math.min(productIds.length, 200);
  const { data: products } = await query.limit(limit);

  let filtered = products ?? [];

  if (params.cert === "sin_tacc") {
    const { data: reviewProducts } = await supabase
      .from("reviews")
      .select("product_id")
      .eq("gluten_certification", "sin_tacc");
    const ids = new Set((reviewProducts ?? []).map((r) => r.product_id));
    filtered = filtered.filter((p) => ids.has(p.id));
  }

  return filtered as ProductRowForCard[];
}

export function mapProductToCard(
  p: ProductRowForCard,
  getBrandName: (b: ProductRowForCard["brands"]) => string | undefined
) {
  const images = (p.product_images ?? []) as { url: string; sort_order: number }[];
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
}
