import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await getAuthedSupabase(_request);
  if ("error" in auth && auth.error) return auth.error;
  const { supabase, user, response } = auth;
  const { userId: targetId } = await params;

  if (targetId === user.id) {
    return listJson({ ok: false, error: "No podés seguirte a vos mismo." }, 400);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", targetId)
    .maybeSingle();

  if (!profile) return listJson({ ok: false, error: "Usuario no encontrado." }, 404);

  const { data: existing } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetId);
    if (error) return listJson({ ok: false, error: error.message }, 500);
    return withCookies(response, listJson({ ok: true, following: false }));
  }

  const { error } = await supabase.from("user_follows").insert({
    follower_id: user.id,
    following_id: targetId,
  });
  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true, following: true }));
}
