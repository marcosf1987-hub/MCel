import type { SupabaseClient } from "@supabase/supabase-js";
import { getUserFavoriteProductIds } from "@/lib/favorites-server";

export async function getProductCardAuthContext(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favoriteIds = user
    ? await getUserFavoriteProductIds(supabase, user.id)
    : new Set<string>();
  return { isLoggedIn: Boolean(user), favoriteIds };
}
