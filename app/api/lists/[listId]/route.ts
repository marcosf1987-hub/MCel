import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import { FAVORITES_LIST_SLUG, resolveUniqueListSlug } from "@/lib/lists";
import type { ListVisibility } from "@/types/database";

const VIS: ListVisibility[] = ["public", "unlisted", "private"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  const { data: list } = await supabase
    .from("product_lists")
    .select("id, user_id, slug, is_system, title")
    .eq("id", listId)
    .maybeSingle();

  if (!list || list.user_id !== user.id) {
    return listJson({ ok: false, error: "Lista no encontrada." }, 404);
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    visibility?: ListVisibility;
  };

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return listJson({ ok: false, error: "El título es obligatorio." }, 400);
    updates.title = title;
    if (!list.is_system) {
      updates.slug = await resolveUniqueListSlug(supabase, user.id, title, listId);
    }
  }

  if (body.description !== undefined) {
    updates.description = String(body.description).trim() || null;
  }

  if (body.visibility !== undefined && VIS.includes(body.visibility)) {
    if (list.is_system && list.slug === FAVORITES_LIST_SLUG) {
      updates.visibility = "private";
    } else {
      updates.visibility = body.visibility;
    }
  }

  const { data, error } = await supabase
    .from("product_lists")
    .update(updates)
    .eq("id", listId)
    .select("id, slug, title, description, visibility, is_system, vote_count")
    .single();

  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true, list: data }));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  const { data: list } = await supabase
    .from("product_lists")
    .select("id, user_id, is_system")
    .eq("id", listId)
    .maybeSingle();

  if (!list || list.user_id !== user.id) {
    return listJson({ ok: false, error: "Lista no encontrada." }, 404);
  }

  if (list.is_system) {
    return listJson({ ok: false, error: "No podés eliminar Mis favoritos." }, 400);
  }

  const { error } = await supabase.from("product_lists").delete().eq("id", listId);
  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true }));
}
