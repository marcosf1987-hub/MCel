import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sortTaxonomyCategories } from "@/lib/catalog-taxonomy";
import type { CategoriesNavData, CategoryWithCount } from "@/lib/categories-types";

export type { CategoriesNavData, CategoryWithCount } from "@/lib/categories-types";

async function fetchCategoriesNavData(): Promise<CategoriesNavData> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return { categories: [], totalProducts: 0 };
  }

  const { data: categoriesRaw, error: catError } = await supabase
    .from("categories")
    .select("id, name, name_es, slug, subcategories(id, name, name_es, slug)")
    .order("name")
    .eq("is_system", true);

  let categories = categoriesRaw;

  if (catError?.message.includes("is_system")) {
    const { data: fallback, error: fbErr } = await supabase
      .from("categories")
      .select("id, name, name_es, slug, subcategories(id, name, name_es, slug)")
      .order("name");
    if (fbErr) {
      console.error("categories-cache categories:", fbErr);
      return { categories: [], totalProducts: 0 };
    }
    categories = fallback;
  } else if (catError) {
    console.error("categories-cache categories:", catError);
    return { categories: [], totalProducts: 0 };
  }

  const { data: productRows, error: prodError } = await supabase
    .from("products")
    .select("category_id, subcategory_id")
    .is("deleted_at", null);

  if (prodError) {
    console.error("categories-cache products:", prodError);
    return { categories: [], totalProducts: 0 };
  }

  const categoryCounts = new Map<string, number>();
  const subcategoryCounts = new Map<string, number>();
  for (const row of productRows ?? []) {
    categoryCounts.set(
      row.category_id,
      (categoryCounts.get(row.category_id) ?? 0) + 1
    );
    subcategoryCounts.set(
      row.subcategory_id,
      (subcategoryCounts.get(row.subcategory_id) ?? 0) + 1
    );
  }

  const withCounts: CategoryWithCount[] = sortTaxonomyCategories(
    (categories ?? []).map((c) => {
      const subs = (c.subcategories ?? []) as {
        id: string;
        name: string;
        name_es: string | null;
        slug: string;
      }[];
      return {
        id: c.id,
        name: c.name,
        name_es: c.name_es,
        slug: c.slug,
        product_count: categoryCounts.get(c.id) ?? 0,
        subcategories: subs
          .map((s) => ({
            ...s,
            product_count: subcategoryCounts.get(s.id) ?? 0,
          }))
          .sort((a, b) =>
            (a.name_es ?? a.name).localeCompare(b.name_es ?? b.name, "es")
          ),
      };
    })
  );

  return {
    categories: withCounts,
    totalProducts: productRows?.length ?? 0,
  };
}

/** Categorías con subcategorías y conteo de productos; revalida cada 1 hora. */
export const getCategoriesNavData = unstable_cache(
  fetchCategoriesNavData,
  ["categories-nav-data-v2"],
  { revalidate: 3600, tags: ["categories-counts"] }
);
