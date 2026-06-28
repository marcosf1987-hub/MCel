import type { SupabaseClient } from "@supabase/supabase-js";
import {
  countUnreadNotifications as countUnreadListNotifications,
  fetchUserNotifications,
  type EnrichedNotification,
} from "@/lib/list-notifications";
import {
  countUnreadModerationNotifications,
  fetchUserModerationNotifications,
  type UserNotificationRow,
} from "@/lib/user-notifications";

export type ListAppNotification = EnrichedNotification & {
  source: "list";
};

export type ModerationAppNotification = UserNotificationRow & {
  source: "moderation";
};

export type AppNotification = ListAppNotification | ModerationAppNotification;

export async function fetchAllNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 40
): Promise<AppNotification[]> {
  const listRows = await fetchUserNotifications(supabase, userId, limit);

  let modRows: UserNotificationRow[] = [];
  try {
    modRows = await fetchUserModerationNotifications(supabase, userId, limit);
  } catch {
    modRows = [];
  }

  const merged: AppNotification[] = [
    ...listRows.map((n) => ({ ...n, source: "list" as const })),
    ...modRows.map((n) => ({ ...n, source: "moderation" as const })),
  ];

  merged.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return merged.slice(0, limit);
}

export async function countAllUnreadNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const listCount = await countUnreadListNotifications(supabase, userId);
  try {
    const modCount = await countUnreadModerationNotifications(supabase, userId);
    return listCount + modCount;
  } catch {
    return listCount;
  }
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string,
  source?: "list" | "moderation"
): Promise<boolean> {
  const now = new Date().toISOString();

  if (source === "list" || !source) {
    const { data } = await supabase
      .from("list_notifications")
      .update({ read_at: now })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (data) return true;
    if (source === "list") return false;
  }

  const { data } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  return Boolean(data);
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    supabase
      .from("list_notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null),
    supabase
      .from("user_notifications")
      .update({ read_at: now })
      .eq("user_id", userId)
      .is("read_at", null),
  ]);
}
