import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import type { ListVoteType } from "@/types/database";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  const body = (await request.json().catch(() => ({}))) as { type?: string };
  const voteType = body.type === "down" ? "down" : "up";

  const { data: list } = await supabase
    .from("product_lists")
    .select("id, user_id, visibility, vote_count, downvote_count")
    .eq("id", listId)
    .maybeSingle();

  if (!list) return listJson({ ok: false, error: "Lista no encontrada." }, 404);

  if (list.visibility === "private" && list.user_id !== user.id) {
    return listJson({ ok: false, error: "Lista privada." }, 403);
  }

  if (list.user_id === user.id) {
    return listJson({ ok: false, error: "No podés votar tu propia lista." }, 400);
  }

  const { data: existing } = await supabase
    .from("list_votes")
    .select("vote_type")
    .eq("list_id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  const existingType = existing?.vote_type as ListVoteType | undefined;

  if (existingType === voteType) {
    const { error } = await supabase
      .from("list_votes")
      .delete()
      .eq("list_id", listId)
      .eq("user_id", user.id);
    if (error) return listJson({ ok: false, error: error.message }, 500);
  } else if (existingType) {
    const { error } = await supabase
      .from("list_votes")
      .update({ vote_type: voteType })
      .eq("list_id", listId)
      .eq("user_id", user.id);
    if (error) return listJson({ ok: false, error: error.message }, 500);
  } else {
    const { error } = await supabase.from("list_votes").insert({
      list_id: listId,
      user_id: user.id,
      vote_type: voteType,
    });
    if (error) return listJson({ ok: false, error: error.message }, 500);
  }

  const { data: updated } = await supabase
    .from("product_lists")
    .select("vote_count, downvote_count")
    .eq("id", listId)
    .single();

  const { data: myVote } = await supabase
    .from("list_votes")
    .select("vote_type")
    .eq("list_id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  return withCookies(
    response,
    listJson({
      ok: true,
      myVote: (myVote?.vote_type as ListVoteType) ?? null,
      voteCount: updated?.vote_count ?? 0,
      downvoteCount: updated?.downvote_count ?? 0,
    })
  );
}
