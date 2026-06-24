import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import { canEditList } from "@/lib/social-lists";
import { getNextListItemSortOrder, isProductInList } from "@/lib/lists";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  const canEdit = await canEditList(supabase, listId, user.id);
  if (!canEdit) {
    return listJson({ ok: false, error: "Lista no encontrada o sin permiso de edición." }, 404);
  }

  const body = (await request.json()) as { productId?: string };
  const productId = String(body.productId ?? "").trim();
  if (!productId) return listJson({ ok: false, error: "Falta productId." }, 400);

  if (await isProductInList(supabase, listId, productId)) {
    return listJson({ ok: true, alreadyInList: true });
  }

  const sortOrder = await getNextListItemSortOrder(supabase, listId);
  const { error } = await supabase.from("product_list_items").insert({
    list_id: listId,
    product_id: productId,
    sort_order: sortOrder,
  });

  if (error) return listJson({ ok: false, error: error.message }, 500);

  await supabase
    .from("product_lists")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", listId);

  return withCookies(response, listJson({ ok: true, added: true }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  const productId = request.nextUrl.searchParams.get("productId")?.trim();
  if (!productId) return listJson({ ok: false, error: "Falta productId." }, 400);

  const canEdit = await canEditList(supabase, listId, user.id);
  if (!canEdit) {
    return listJson({ ok: false, error: "Lista no encontrada o sin permiso de edición." }, 404);
  }

  const { error } = await supabase
    .from("product_list_items")
    .delete()
    .eq("list_id", listId)
    .eq("product_id", productId);

  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true }));
}
