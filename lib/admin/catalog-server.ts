import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Brand,
  Category,
  ImageQualityStatus,
  ProductImageQualityDetails,
  Subcategory,
} from "@/types/database";
import { getBrandName, getRelation } from "@/lib/utils";

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  barcode: string;
  brand_id: string;
  category_id: string;
  subcategory_id: string;
  brand_name: string;
  category_name: string;
  subcategory_name: string;
  review_count: number;
  weighted_rating: number | null;
  deleted_at: string | null;
  created_at: string;
};

export type AdminBrandRow = Brand & { product_count: number };

export type AdminCategoryRow = Category & {
  subcategories: Subcategory[];
};

export type ReviewImageRow = {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
  image_source: string;
  quality_score: number | null;
  quality_status: ImageQualityStatus;
  quality_details: ProductImageQualityDetails | null;
  is_hidden: boolean;
  created_at: string;
  product_name: string;
  product_slug: string;
};

export async function fetchAdminProducts(
  supabase: SupabaseClient,
  opts: { q?: string; includeDeleted?: boolean; limit?: number } = {}
): Promise<AdminProductRow[]> {
  const limit = opts.limit ?? 50;

  let query = supabase
    .from("products")
    .select(
      `
      id, name, slug, barcode, brand_id, category_id, subcategory_id,
      review_count, weighted_rating, deleted_at, created_at,
      brands(name),
      categories(name, name_es),
      subcategories(name, name_es)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!opts.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  if (opts.q?.trim()) {
    const term = opts.q.trim();
    query = query.or(`name.ilike.%${term}%,barcode.ilike.%${term}%`);
  }

  const { data: rows } = await query;
  if (!rows?.length) return [];

  return rows.map((row) => {
    const category = getRelation<{ name: string; name_es: string | null }>(
      row.categories
    );
    const subcategory = getRelation<{ name: string; name_es: string | null }>(
      row.subcategories
    );

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      barcode: row.barcode,
      brand_id: row.brand_id,
      category_id: row.category_id,
      subcategory_id: row.subcategory_id,
      brand_name: getBrandName(row.brands) ?? "—",
      category_name: category?.name_es ?? category?.name ?? "—",
      subcategory_name: subcategory?.name_es ?? subcategory?.name ?? "—",
      review_count: row.review_count,
      weighted_rating: row.weighted_rating,
      deleted_at: row.deleted_at ?? null,
      created_at: row.created_at,
    };
  });
}

export async function fetchAdminBrands(
  supabase: SupabaseClient
): Promise<AdminBrandRow[]> {
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug, created_at")
    .order("name");

  if (!brands?.length) return [];

  const { data: counts } = await supabase
    .from("products")
    .select("brand_id")
    .is("deleted_at", null);

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    countMap.set(row.brand_id, (countMap.get(row.brand_id) ?? 0) + 1);
  }

  return brands.map((b) => ({
    ...b,
    product_count: countMap.get(b.id) ?? 0,
  }));
}

export async function fetchAdminCategories(
  supabase: SupabaseClient
): Promise<AdminCategoryRow[]> {
  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("subcategories").select("*").order("name"),
  ]);

  const subsByCategory = new Map<string, Subcategory[]>();
  for (const sub of subcategories ?? []) {
    const list = subsByCategory.get(sub.category_id) ?? [];
    list.push(sub);
    subsByCategory.set(sub.category_id, list);
  }

  return (categories ?? []).map((cat) => ({
    ...cat,
    subcategories: subsByCategory.get(cat.id) ?? [],
  }));
}

export async function fetchReviewImages(
  supabase: SupabaseClient,
  limit = 50
): Promise<ReviewImageRow[]> {
  const { data: images } = await supabase
    .from("product_images")
    .select(
      `
      id, product_id, url, sort_order, image_source,
      quality_score, quality_status, quality_details, is_hidden, created_at,
      products(name, slug)
    `
    )
    .eq("quality_status", "needs_review")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!images?.length) return [];

  return images.map((img) => {
    const product = getRelation<{ name: string; slug: string }>(img.products);
    return {
      id: img.id,
      product_id: img.product_id,
      url: img.url,
      sort_order: img.sort_order,
      image_source: img.image_source,
      quality_score: img.quality_score,
      quality_status: img.quality_status as ImageQualityStatus,
      quality_details: img.quality_details as ProductImageQualityDetails | null,
      is_hidden: img.is_hidden,
      created_at: img.created_at,
      product_name: product?.name ?? "Producto",
      product_slug: product?.slug ?? "",
    };
  });
}

export async function countReviewImages(
  supabase: SupabaseClient
): Promise<number> {
  const { count } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("quality_status", "needs_review");

  return count ?? 0;
}
