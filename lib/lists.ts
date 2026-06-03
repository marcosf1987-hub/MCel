import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/lib/utils";
import type { ListVisibility } from "@/types/database";

export const FAVORITES_LIST_SLUG = "mis-favoritos";
export const FAVORITES_LIST_TITLE = "Mis favoritos";

export const LIST_VISIBILITY_LABELS: Record<ListVisibility, string> = {
  public: "Pública",
  unlisted: "Con link",
  private: "Privada",
};

export function canViewList(
  list: { visibility: ListVisibility; user_id: string },
  viewerId: string | null
): boolean {
  if (list.visibility === "public" || list.visibility === "unlisted") return true;
  return viewerId !== null && list.user_id === viewerId;
}

export async function getOrCreateFavoritesList(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; slug: string }> {
  const { data: existing } = await supabase
    .from("product_lists")
    .select("id, slug")
    .eq("user_id", userId)
    .eq("is_system", true)
    .eq("slug", FAVORITES_LIST_SLUG)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("product_lists")
    .insert({
      user_id: userId,
      title: FAVORITES_LIST_TITLE,
      slug: FAVORITES_LIST_SLUG,
      description: "Productos que guardaste con el corazón",
      visibility: "private",
      is_system: true,
    })
    .select("id, slug")
    .single();

  if (error) throw error;
  return data;
}

export async function resolveUniqueListSlug(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  excludeListId?: string
): Promise<string> {
  let base = slugify(title) || "lista";
  if (base === FAVORITES_LIST_SLUG) base = "mi-lista";

  let candidate = base;
  let n = 0;

  while (true) {
    let query = supabase
      .from("product_lists")
      .select("id")
      .eq("user_id", userId)
      .eq("slug", candidate);

    if (excludeListId) query = query.neq("id", excludeListId);

    const { data } = await query.maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export async function getNextListItemSortOrder(
  supabase: SupabaseClient,
  listId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("product_list_items")
    .select("*", { count: "exact", head: true })
    .eq("list_id", listId);

  if (error) throw error;
  return count ?? 0;
}

export async function isProductInList(
  supabase: SupabaseClient,
  listId: string,
  productId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("product_list_items")
    .select("id")
    .eq("list_id", listId)
    .eq("product_id", productId)
    .maybeSingle();

  return Boolean(data);
}
