import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import { isListOwner } from "@/lib/social-lists";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ listId: string; commentId: string }> }
) {
  const auth = await getAuthedSupabase(_request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId, commentId } = await params;

  const { data: comment } = await supabase
    .from("list_comments")
    .select("user_id")
    .eq("id", commentId)
    .eq("list_id", listId)
    .maybeSingle();

  if (!comment) return listJson({ ok: false, error: "Comentario no encontrado." }, 404);

  const owner = await isListOwner(supabase, listId, user.id);
  if (comment.user_id !== user.id && !owner) {
    return listJson({ ok: false, error: "Sin permiso." }, 403);
  }

  const { error } = await supabase.from("list_comments").delete().eq("id", commentId);
  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true }));
}
