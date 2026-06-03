import type { SupabaseClient } from "@supabase/supabase-js";
import { FAVORITES_LIST_SLUG, getOrCreateFavoritesList } from "@/lib/lists";

export async function getUserFavoriteProductIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data: list } = await supabase
    .from("product_lists")
    .select("id")
    .eq("user_id", userId)
    .eq("is_system", true)
    .eq("slug", FAVORITES_LIST_SLUG)
    .maybeSingle();

  if (!list) return new Set();

  const { data: items } = await supabase
    .from("product_list_items")
    .select("product_id")
    .eq("list_id", list.id);

  return new Set((items ?? []).map((i) => i.product_id));
}

export async function isProductFavorited(
  supabase: SupabaseClient,
  userId: string,
  productId: string
): Promise<boolean> {
  const favorites = await getUserFavoriteProductIds(supabase, userId);
  return favorites.has(productId);
}

export async function ensureFavoritesList(
  supabase: SupabaseClient,
  userId: string
) {
  return getOrCreateFavoritesList(supabase, userId);
}
