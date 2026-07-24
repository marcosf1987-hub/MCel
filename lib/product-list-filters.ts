import type { SupabaseClient } from "@supabase/supabase-js";
import { applyCatalogFilters } from "@/lib/apply-product-filters";
import { mapRowToProductCard } from "@/lib/product-cards";
import { orderByIdList, searchProductIds } from "@/lib/search/catalog";

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
  deleted_at?: string | null;
  barcode?: string | null;
  product_images?: { url: string; sort_order: number; is_hidden?: boolean }[] | null;
  brands?: { name: string; slug?: string } | { name: string; slug?: string }[] | null;
  categories?: { slug: string } | { slug: string }[] | null;
  subcategories?: { slug: string } | { slug: string }[] | null;
};

const PRODUCT_SELECT = `
  id, slug, name, barcode, deleted_at, weighted_rating, review_count,
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

  let rankedIds: string[] | null = null;
  if (params.q) {
    const hits = await searchProductIds(supabase, params.q, 100);
    if (hits !== null) {
      const allowed = productIds !== null ? new Set(productIds) : null;
      rankedIds = allowed ? hits.filter((id) => allowed.has(id)) : hits;
      if (rankedIds.length === 0) return [];
    }
  }

  let query = supabase.from("products").select(PRODUCT_SELECT);

  if (rankedIds) {
    query = query.in("id", rankedIds);
  } else if (productIds !== null) {
    query = query.in("id", productIds);
  }

  if (params.q && rankedIds === null) {
    // Fallback si la RPC aún no está aplicada
    query = query.ilike("name", `%${params.q}%`);
  }
  if (params.marca) query = query.eq("brands.slug", params.marca);
  if (params.categoria) query = query.eq("categories.slug", params.categoria);
  if (params.subcategoria) query = query.eq("subcategories.slug", params.subcategoria);

  const sort = params.sort ?? "default";
  const useRelevanceOrder = Boolean(rankedIds) && sort === "default";

  if (!useRelevanceOrder) {
    if (sort === "name") {
      query = query.order("name", { ascending: true });
    } else if (sort === "rating") {
      query = query.order("weighted_rating", { ascending: false, nullsFirst: false });
    } else if (sort === "reviews") {
      query = query.order("review_count", { ascending: false });
    } else {
      query = query.order(defaultOrder.column, { ascending: defaultOrder.ascending });
    }
  }

  const limit =
    rankedIds !== null
      ? Math.min(rankedIds.length, 200)
      : productIds === null
        ? 48
        : Math.min(productIds.length, 200);
  const { data: products } = await query.limit(limit);

  let rows = (products ?? []) as ProductRowForCard[];
  if (useRelevanceOrder && rankedIds) {
    rows = orderByIdList(rows, rankedIds);
  }

  const ratingParam = params.rating ?? params.minRating;
  const filtered = await applyCatalogFilters(
    supabase,
    rows,
    params.cert,
    ratingParam
  );

  return filtered;
}

export function mapProductToCard(
  p: ProductRowForCard,
  getBrandName: (b: ProductRowForCard["brands"]) => string | undefined
) {
  return mapRowToProductCard(p, getBrandName);
}
