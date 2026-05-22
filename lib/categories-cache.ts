import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { CategoriesNavData, CategoryWithCount } from "@/lib/categories-types";

export type { CategoriesNavData, CategoryWithCount } from "@/lib/categories-types";

async function fetchCategoriesNavData(): Promise<CategoriesNavData> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { categories: [], totalProducts: 0 };
  }

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, name_es, slug")
    .order("name");

  if (catError) {
    console.error("categories-cache categories:", catError);
    return { categories: [], totalProducts: 0 };
  }

  const { data: productRows, error: prodError } = await supabase
    .from("products")
    .select("category_id");

  if (prodError) {
    console.error("categories-cache products:", prodError);
    return { categories: [], totalProducts: 0 };
  }

  const counts = new Map<string, number>();
  for (const row of productRows ?? []) {
    counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
  }

  const withCounts: CategoryWithCount[] = (categories ?? [])
    .map((c) => ({
      ...c,
      product_count: counts.get(c.id) ?? 0,
    }))
    .sort((a, b) =>
      (a.name_es ?? a.name).localeCompare(b.name_es ?? b.name, "es")
    );

  return {
    categories: withCounts,
    totalProducts: productRows?.length ?? 0,
  };
}

/** Categorías con conteo de productos; se revalida cada 1 hora. */
export const getCategoriesNavData = unstable_cache(
  fetchCategoriesNavData,
  ["categories-nav-data"],
  { revalidate: 3600, tags: ["categories-counts"] }
);
