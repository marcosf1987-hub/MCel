import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogSuggestion = {
  type: string;
  label: string;
  href: string;
};

type ProductIdHit = { id: string; score: number };
type SuggestionHit = {
  result_type: string;
  label: string;
  href: string;
  score: number;
};

/** IDs de producto ordenados por relevancia (tildes, artículos, variantes). */
export async function searchProductIds(
  supabase: SupabaseClient,
  q: string,
  limit = 48
): Promise<string[] | null> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const { data, error } = await supabase.rpc("search_product_ids", {
    p_query: trimmed,
    p_limit: limit,
  });

  if (error) {
    console.error("search_product_ids:", error.message);
    return null;
  }

  return ((data ?? []) as ProductIdHit[]).map((row) => row.id);
}

export async function searchCatalogSuggestions(
  supabase: SupabaseClient,
  q: string,
  limit = 12
): Promise<CatalogSuggestion[] | null> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];

  const { data, error } = await supabase.rpc("search_catalog_suggestions", {
    p_query: trimmed,
    p_limit: limit,
  });

  if (error) {
    console.error("search_catalog_suggestions:", error.message);
    return null;
  }

  return ((data ?? []) as SuggestionHit[]).map((row) => ({
    type: row.result_type,
    label: row.label,
    href: row.href,
  }));
}

export function orderByIdList<T extends { id: string }>(
  rows: T[],
  ids: string[]
): T[] {
  const order = new Map(ids.map((id, index) => [id, index]));
  return [...rows].sort(
    (a, b) => (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );
}
