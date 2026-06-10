import type { SupabaseClient } from "@supabase/supabase-js";
import { applyCatalogFilters } from "@/lib/apply-product-filters";
import { visibleProductImages } from "@/lib/product-images-display";

export type ProductListParams = {
  q?: string;
  marca?: string;
  categoria?: string;
  subcategoria?: string;
  cert?: string;
  rating?: string;
  minRating?: string;
  sort?: string;
};

export type ProductRowForCard = {
  id: string;
  slug: string;
  name: string;
  weighted_rating: number | null;
  review_count: number;
  product_images?: { url: string; sort_order: number; is_hidden?: boolean }[] | null;
  brands?: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
  categories?: { slug: string } | { slug: string }[] | null;
  subcategories?: { slug: string } | { slug: string }[] | null;
};

const PRODUCT_SELECT = `
  id, slug, name, weighted_rating, review_count,
  brands!inner(name, slug),
  categories!inner(slug),
  subcategories!inner(slug),
  product_images(url, sort_order, is_hidden)
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

  const ratingParam = params.rating ?? params.minRating;
  const filtered = await applyCatalogFilters(
    supabase,
    (products ?? []) as ProductRowForCard[],
    params.cert,
    ratingParam
  );

  return filtered;
}

export function mapProductToCard(
  p: ProductRowForCard,
  getBrandName: (b: ProductRowForCard["brands"]) => string | undefined
) {
  const images = visibleProductImages(
    (p.product_images ?? []) as { url: string; sort_order: number; is_hidden?: boolean }[]
  );
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
