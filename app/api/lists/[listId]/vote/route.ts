import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  const { data: list } = await supabase
    .from("product_lists")
    .select("id, user_id, visibility, vote_count")
    .eq("id", listId)
    .maybeSingle();

  if (!list) return listJson({ ok: false, error: "Lista no encontrada." }, 404);

  if (list.visibility === "private" && list.user_id !== user.id) {
    return listJson({ ok: false, error: "Lista privada." }, 403);
  }

  const { data: existing } = await supabase
    .from("list_votes")
    .select("list_id")
    .eq("list_id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("list_votes")
      .delete()
      .eq("list_id", listId)
      .eq("user_id", user.id);
    if (error) return listJson({ ok: false, error: error.message }, 500);

    const { data: updated } = await supabase
      .from("product_lists")
      .select("vote_count")
      .eq("id", listId)
      .single();

    return withCookies(
      response,
      listJson({ ok: true, voted: false, voteCount: updated?.vote_count ?? 0 })
    );
  }

  const { error } = await supabase.from("list_votes").insert({
    list_id: listId,
    user_id: user.id,
  });
  if (error) return listJson({ ok: false, error: error.message }, 500);

  const { data: updated } = await supabase
    .from("product_lists")
    .select("vote_count")
    .eq("id", listId)
    .single();

  return withCookies(
    response,
    listJson({ ok: true, voted: true, voteCount: updated?.vote_count ?? 0 })
  );
}
