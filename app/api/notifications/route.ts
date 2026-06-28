import { NextRequest } from "next/server";
import { getAuthedSupabase, listJson, withCookies } from "@/lib/api/lists-auth";
import {
  countAllUnreadNotifications,
  fetchAllNotifications,
  markAllNotificationsRead,
} from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const auth = await getAuthedSupabase(request);
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, user, response } = auth;
  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";

  if (unreadOnly) {
    const count = await countAllUnreadNotifications(supabase, user.id);
    return withCookies(response, listJson({ ok: true, unreadCount: count }));
  }

  const notifications = await fetchAllNotifications(supabase, user.id);
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

  await markAllNotificationsRead(supabase, user.id);

  return withCookies(response, listJson({ ok: true }));
}
