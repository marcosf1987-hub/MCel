import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import { markNotificationRead } from "@/lib/notifications";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user, response } = auth;

  const sourceParam = request.nextUrl.searchParams.get("source");
  const source =
    sourceParam === "list" || sourceParam === "moderation"
      ? sourceParam
      : undefined;

  const ok = await markNotificationRead(supabase, user.id, id, source);

  if (!ok) {
    return listJson({ ok: false, error: "Notificación no encontrada." }, 404);
  }

  return withCookies(response, listJson({ ok: true }));
}
