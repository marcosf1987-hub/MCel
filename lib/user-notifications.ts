import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserNotificationType } from "@/types/database";
import type { ModerationTargetType } from "@/lib/admin/moderation";

export type UserNotificationRow = {
  id: string;
  type: UserNotificationType;
  title: string;
  message: string;
  link_href: string | null;
  read_at: string | null;
  created_at: string;
};

export async function createUserNotification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    actorId?: string | null;
    type: UserNotificationType;
    title: string;
    message: string;
    linkHref?: string | null;
  }
): Promise<void> {
  if (params.actorId && params.actorId === params.userId) return;

  const { error } = await supabase.from("user_notifications").insert({
    user_id: params.userId,
    actor_id: params.actorId ?? null,
    type: params.type,
    title: params.title,
    message: params.message,
    link_href: params.linkHref ?? null,
  });

  if (error) {
    console.error("user_notifications:", error);
  }
}

export async function fetchUserModerationNotifications(
  supabase: SupabaseClient,
  userId: string,
  limit = 40
): Promise<UserNotificationRow[]> {
  const { data: rows } = await supabase
    .from("user_notifications")
    .select("id, type, title, message, link_href, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (rows ?? []) as UserNotificationRow[];
}

export async function countUnreadModerationNotifications(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count } = await supabase
    .from("user_notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return count ?? 0;
}

const TARGET_LABELS: Record<ModerationTargetType, string> = {
  product: "producto",
  review: "evaluación",
  list: "lista",
  list_comment: "comentario",
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function resolveModerationTargetOwner(
  supabase: SupabaseClient,
  targetType: ModerationTargetType,
  targetId: string
): Promise<{ userId: string | null; label: string; linkHref: string | null }> {
  if (targetType === "product") {
    const { data } = await supabase
      .from("products")
      .select("created_by, name, slug")
      .eq("id", targetId)
      .maybeSingle();
    return {
      userId: data?.created_by ?? null,
      label: data?.name ?? "producto",
      linkHref: data?.slug ? `/productos/${data.slug}` : null,
    };
  }

  if (targetType === "review") {
    const { data } = await supabase
      .from("reviews")
      .select("user_id, product_id, products(slug, name)")
      .eq("id", targetId)
      .maybeSingle();
    const product = firstRelation(data?.products);
    return {
      userId: data?.user_id ?? null,
      label: product?.name ?? "evaluación",
      linkHref: product?.slug ? `/productos/${product.slug}` : null,
    };
  }

  if (targetType === "list") {
    const { data } = await supabase
      .from("product_lists")
      .select("user_id, title, slug, profiles(username)")
      .eq("id", targetId)
      .maybeSingle();
    const owner = firstRelation(data?.profiles);
    const href =
      owner?.username && data?.slug
        ? `/listas/${owner.username}/${data.slug}`
        : null;
    return {
      userId: data?.user_id ?? null,
      label: data?.title ?? "lista",
      linkHref: href,
    };
  }

  if (targetType === "list_comment") {
    const { data } = await supabase
      .from("list_comments")
      .select(
        "user_id, list_id, product_lists(title, slug, profiles(username))"
      )
      .eq("id", targetId)
      .maybeSingle();
    const list = firstRelation(data?.product_lists);
    const listOwner = list ? firstRelation(list.profiles) : null;
    const href =
      listOwner?.username && list?.slug
        ? `/listas/${listOwner.username}/${list.slug}`
        : null;
    return {
      userId: data?.user_id ?? null,
      label: list?.title ?? "comentario",
      linkHref: href,
    };
  }

  return { userId: null, label: TARGET_LABELS[targetType], linkHref: null };
}

export async function notifyModerationAction(
  supabase: SupabaseClient,
  params: {
    actorId: string;
    targetType: ModerationTargetType;
    targetId: string;
    action: "hidden" | "restored";
    note?: string | null;
  }
): Promise<void> {
  const owner = await resolveModerationTargetOwner(
    supabase,
    params.targetType,
    params.targetId
  );
  if (!owner.userId) return;

  const type: UserNotificationType =
    params.action === "hidden" ? "content_hidden" : "content_restored";
  const verb =
    params.action === "hidden" ? "fue ocultado" : "fue restaurado";
  const entity = TARGET_LABELS[params.targetType];

  let message = `Tu ${entity} «${owner.label}» ${verb} por el equipo de moderación.`;
  if (params.note?.trim() && params.action === "hidden") {
    message += ` Nota: ${params.note.trim()}`;
  }

  await createUserNotification(supabase, {
    userId: owner.userId,
    actorId: params.actorId,
    type,
    title:
      params.action === "hidden"
        ? "Contenido moderado"
        : "Contenido restaurado",
    message,
    linkHref: owner.linkHref,
  });
}

export async function notifyAccountSuspended(
  supabase: SupabaseClient,
  actorId: string,
  userId: string,
  reason: string
): Promise<void> {
  const trimmed = reason.trim();
  const message = trimmed
    ? `Tu cuenta fue suspendida. Motivo: ${trimmed}`
    : "Tu cuenta fue suspendida por el equipo de moderación.";

  await createUserNotification(supabase, {
    userId,
    actorId,
    type: "account_suspended",
    title: "Cuenta suspendida",
    message,
    linkHref: "/login",
  });
}

export async function notifyAccountUnsuspended(
  supabase: SupabaseClient,
  actorId: string,
  userId: string
): Promise<void> {
  await createUserNotification(supabase, {
    userId,
    actorId,
    type: "account_unsuspended",
    title: "Cuenta reactivada",
    message: "Tu cuenta fue reactivada. Ya podés volver a usar CeliApp.",
    linkHref: "/",
  });
}
