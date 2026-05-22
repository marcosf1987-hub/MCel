import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserFavoriteProductIds(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("favorites")
    .select("product_id")
    .eq("user_id", userId);

  return new Set((data ?? []).map((f) => f.product_id));
}
