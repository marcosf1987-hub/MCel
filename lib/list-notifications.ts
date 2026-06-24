import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListNotificationType } from "@/types/database";

export async function createListNotification(
  supabase: SupabaseClient,
  params: {
    recipientId: string;
    actorId: string;
    listId: string;
    type: ListNotificationType;
    commentId?: string;
  }
): Promise<void> {
  if (params.recipientId === params.actorId) return;

  const { error } = await supabase.from("list_notifications").insert({
    user_id: params.recipientId,
    actor_id: params.actorId,
    list_id: params.listId,
    type: params.type,
    comment_id: params.commentId ?? null,
  });

  if (error) {
    console.error("list_notifications:", error);
  }
}

export type EnrichedNotification = {
  id: string;
  type: ListNotificationType;
  read_at: string | null;
  created_at: string;
  list_id: string;
  list_title: string;
  list_slug: string;
  owner_username: string | null;
  actor_name: string | null;
  actor_username: string | null;
};

export async function fetchUserNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 40
): Promise<EnrichedNotification[]> {
  const { data: rows } = await supabase
    .from("list_notifications")
    .select("id, type, read_at, created_at, list_id, actor_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!rows?.length) return [];

  const listIds = [...new Set(rows.map((r) => r.list_id))];
  const actorIds = [...new Set(rows.map((r) => r.actor_id))];

  const [{ data: lists }, { data: actors }] = await Promise.all([
    supabase
      .from("product_lists")
      .select("id, title, slug, user_id")
      .in("id", listIds),
    supabase
      .from("profiles")
      .select("id, username, display_name")
      .in("id", actorIds),
  ]);

  const ownerIds = [...new Set((lists ?? []).map((l) => l.user_id))];
  const { data: owners } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", ownerIds);

  const listMap = new Map((lists ?? []).map((l) => [l.id, l]));
  const actorMap = new Map((actors ?? []).map((a) => [a.id, a]));
  const ownerMap = new Map((owners ?? []).map((o) => [o.id, o]));

  return rows.map((row) => {
    const list = listMap.get(row.list_id);
    const actor = actorMap.get(row.actor_id);
    const owner = list ? ownerMap.get(list.user_id) : null;
    return {
      id: row.id,
      type: row.type as ListNotificationType,
      read_at: row.read_at,
      created_at: row.created_at,
      list_id: row.list_id,
      list_title: list?.title ?? "Lista",
      list_slug: list?.slug ?? "",
      owner_username: owner?.username ?? null,
      actor_name: actor?.display_name ?? null,
      actor_username: actor?.username ?? null,
    };
  });
}

export async function countUnreadNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("list_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}
