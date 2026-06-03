import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import {
  getNextListItemSortOrder,
  getOrCreateFavoritesList,
  isProductInList,
} from "@/lib/lists";

export async function POST(request: NextRequest) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;

  const body = (await request.json()) as { productId?: string };
  const productId = String(body.productId ?? "").trim();
  if (!productId) return listJson({ ok: false, error: "Falta productId." }, 400);

  const list = await getOrCreateFavoritesList(supabase, user.id);
  const inList = await isProductInList(supabase, list.id, productId);

  if (inList) {
    const { error } = await supabase
      .from("product_list_items")
      .delete()
      .eq("list_id", list.id)
      .eq("product_id", productId);
    if (error) return listJson({ ok: false, error: error.message }, 500);
    return withCookies(
      response,
      listJson({ ok: true, favorited: false, listSlug: list.slug })
    );
  }

  const sortOrder = await getNextListItemSortOrder(supabase, list.id);
  const { error } = await supabase.from("product_list_items").insert({
    list_id: list.id,
    product_id: productId,
    sort_order: sortOrder,
  });
  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(
    response,
    listJson({ ok: true, favorited: true, listSlug: list.slug })
  );
}
