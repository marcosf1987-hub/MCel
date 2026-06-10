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

  const body = (await request.json()) as { username?: string };
  const username = String(body.username ?? "").trim().replace(/^@/, "");
  if (!username) return listJson({ ok: false, error: "Indicá un usuario." }, 400);

  const { data: list } = await supabase
    .from("product_lists")
    .select("id, user_id, is_system")
    .eq("id", listId)
    .maybeSingle();

  if (!list || list.user_id !== user.id) {
    return listJson({ ok: false, error: "Solo el dueño puede invitar colaboradores." }, 403);
  }

  if (list.is_system) {
    return listJson({ ok: false, error: "Mis favoritos no admite colaboradores." }, 400);
  }

  const { data: invitee } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!invitee) return listJson({ ok: false, error: "Usuario no encontrado." }, 404);
  if (invitee.id === user.id) {
    return listJson({ ok: false, error: "Ya sos el dueño de la lista." }, 400);
  }

  const { error } = await supabase.from("list_collaborators").insert({
    list_id: listId,
    user_id: invitee.id,
    invited_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return listJson({ ok: false, error: "Ese usuario ya es colaborador." }, 409);
    }
    return listJson({ ok: false, error: error.message }, 500);
  }

  return withCookies(
    response,
    listJson({
      ok: true,
      collaborator: {
        userId: invitee.id,
        username: invitee.username,
        displayName: invitee.display_name,
      },
    })
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { listId } = await params;

  const collabUserId = request.nextUrl.searchParams.get("userId")?.trim();
  if (!collabUserId) return listJson({ ok: false, error: "Falta userId." }, 400);

  const { data: list } = await supabase
    .from("product_lists")
    .select("user_id")
    .eq("id", listId)
    .maybeSingle();

  if (!list || list.user_id !== user.id) {
    return listJson({ ok: false, error: "Sin permiso." }, 403);
  }

  const { error } = await supabase
    .from("list_collaborators")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", collabUserId);

  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true }));
}
