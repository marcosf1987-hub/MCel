import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import {
  countUnreadNotifications,
  fetchUserNotifications,
} from "@/lib/list-notifications";

export async function GET(request: NextRequest) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user, response } = auth;
  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

  if (unreadOnly) {
    const count = await countUnreadNotifications(supabase, user.id);
    return withCookies(response, listJson({ ok: true, unreadCount: count }));
  }

  const notifications = await fetchUserNotifications(supabase, user.id);
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return withCookies(
    response,
    listJson({ ok: true, notifications, unreadCount })
  );
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user, response } = auth;
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("list_notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return listJson({ ok: false, error: error.message }, 500);

  return withCookies(response, listJson({ ok: true }));
}
