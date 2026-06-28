import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/admin/audit-log";
import { notifyModerationAction } from "@/lib/user-notifications";

export type ModerationTargetType = "product" | "review" | "list" | "list_comment";

export async function hideModerationTarget(
  supabase: SupabaseClient,
  actorId: string,
  targetType: ModerationTargetType,
  targetId: string,
  metadata: Record<string, unknown> = {}
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();

  if (targetType === "product") {
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: now })
      .eq("id", targetId)
      .is("deleted_at", null);
    if (error) return { ok: false, error: error.message };
  } else if (targetType === "review") {
    const { error } = await supabase
      .from("reviews")
      .update({ deleted_at: now })
      .eq("id", targetId)
      .is("deleted_at", null);
    if (error) return { ok: false, error: error.message };
  } else if (targetType === "list") {
    const { error } = await supabase
      .from("product_lists")
      .update({ deleted_at: now, visibility: "private" })
      .eq("id", targetId)
      .is("deleted_at", null);
    if (error) return { ok: false, error: error.message };
  } else if (targetType === "list_comment") {
    const { error } = await supabase
      .from("list_comments")
      .update({ deleted_at: now })
      .eq("id", targetId)
      .is("deleted_at", null);
    if (error) return { ok: false, error: error.message };
  } else {
    return { ok: false, error: "Tipo de contenido no soportado." };
  }

  await logAdminAction(supabase, {
    actorId,
    action: "hide_content",
    entityType: targetType,
    entityId: targetId,
    metadata,
  });

  const note =
    typeof metadata.moderator_note === "string"
      ? metadata.moderator_note
      : null;
  await notifyModerationAction(supabase, {
    actorId,
    targetType,
    targetId,
    action: "hidden",
    note,
  });

  return { ok: true };
}

export async function restoreModerationTarget(
  supabase: SupabaseClient,
  actorId: string,
  targetType: ModerationTargetType,
  targetId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (targetType === "product") {
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: null })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };
  } else if (targetType === "review") {
    const { error } = await supabase
      .from("reviews")
      .update({ deleted_at: null })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };
  } else if (targetType === "list") {
    const { error } = await supabase
      .from("product_lists")
      .update({ deleted_at: null })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };
  } else if (targetType === "list_comment") {
    const { error } = await supabase
      .from("list_comments")
      .update({ deleted_at: null })
      .eq("id", targetId);
    if (error) return { ok: false, error: error.message };
  } else {
    return { ok: false, error: "Tipo de contenido no soportado." };
  }

  await logAdminAction(supabase, {
    actorId,
    action: "restore_content",
    entityType: targetType,
    entityId: targetId,
  });

  await notifyModerationAction(supabase, {
    actorId,
    targetType,
    targetId,
    action: "restored",
  });

  return { ok: true };
}
