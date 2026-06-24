import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user, response } = auth;

  const { error } = await supabase
    .from("list_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true }));
}
