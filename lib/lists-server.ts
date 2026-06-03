import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchFilteredProducts,
  mapProductToCard,
  type ProductListParams,
} from "@/lib/product-list-filters";
import { getBrandName } from "@/lib/utils";
import { canViewList, FAVORITES_LIST_SLUG, getOrCreateFavoritesList } from "@/lib/lists";
import type { ListVisibility, ProductList } from "@/types/database";

/** Lista del usuario por slug; crea «Mis favoritos» si aún no existe. */
export async function getUserListBySlug(
  supabase: SupabaseClient,
  userId: string,
  slug: string
) {
  const { data: list, error } = await supabase
    .from("product_lists")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (list) return list;

  if (slug === FAVORITES_LIST_SLUG) {
    await getOrCreateFavoritesList(supabase, userId);
    const { data: created, error: againError } = await supabase
      .from("product_lists")
      .select("*")
      .eq("user_id", userId)
      .eq("slug", slug)
      .maybeSingle();
    if (againError) throw againError;
    return created;
  }

  return null;
}

export async function getListByUsernameSlug(
  supabase: SupabaseClient,
  username: string,
  listSlug: string,
  viewerId: string | null
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!profile) return null;

  const { data: list } = await supabase
    .from("product_lists")
    .select("*")
    .eq("user_id", profile.id)
    .eq("slug", listSlug)
    .maybeSingle();

  if (!list) return null;
  if (!canViewList(list as { visibility: ListVisibility; user_id: string }, viewerId)) {
    return null;
  }

  return {
    list: { ...list, profile } as ProductList,
    profile,
  };
}

export async function getListProductCards(
  supabase: SupabaseClient,
  listId: string,
  filterParams: ProductListParams = {},
  itemOrder?: { column: string; ascending: boolean }
) {
  const { data: items } = await supabase
    .from("product_list_items")
    .select("product_id, sort_order")
    .eq("list_id", listId)
    .order("sort_order", { ascending: true });

  const productIds = (items ?? []).map((i) => i.product_id);
  if (!productIds.length) return { cards: [], productIds: [] };

  const products = await fetchFilteredProducts(
    supabase,
    productIds,
    filterParams,
    itemOrder
  );

  let ordered = products;
  if (!filterParams.sort) {
    const orderMap = new Map(items!.map((i, idx) => [i.product_id, i.sort_order ?? idx]));
    ordered = [...products].sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
    );
  }

  return {
    cards: ordered.map((p) => mapProductToCard(p, getBrandName)),
    productIds,
  };
}

export async function getTopPublicLists(
  supabase: SupabaseClient,
  limit = 5
) {
  const { data: lists } = await supabase
    .from("product_lists")
    .select("id, title, slug, description, vote_count, user_id")
    .eq("visibility", "public")
    .eq("is_system", false)
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!lists?.length) return [];

  const userIds = [...new Set(lists.map((l) => l.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return lists.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      vote_count: row.vote_count,
      username: profile?.username ?? null,
      display_name: profile?.display_name ?? null,
    };
  });
}

export async function getUserPublicLists(
  supabase: SupabaseClient,
  userId: string
) {
  const { data } = await supabase
    .from("product_lists")
    .select("id, title, slug, description, vote_count, visibility, is_system")
    .eq("user_id", userId)
    .in("visibility", ["public", "unlisted"])
    .order("vote_count", { ascending: false });

  return (data ?? []).filter((l) => !l.is_system);
}

export async function hasUserVotedList(
  supabase: SupabaseClient,
  listId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("list_votes")
    .select("list_id")
    .eq("list_id", listId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}
