import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/admin/audit-log";
import { hasMinRole } from "@/lib/auth/roles";
import type { AppRole } from "@/types/database";

const ROLE_RANK: Record<AppRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
  superadmin: 3,
};

const VALID_ROLES: AppRole[] = ["user", "moderator", "admin", "superadmin"];

export function canAdminActOnUser(
  actorId: string,
  actorRole: AppRole,
  targetId: string,
  targetRole: AppRole
): { ok: true } | { ok: false; error: string } {
  if (actorId === targetId) {
    return { ok: false, error: "No podés modificarte a vos mismo desde el panel." };
  }

  if (actorRole === "superadmin") return { ok: true };

  if (ROLE_RANK[targetRole] >= ROLE_RANK.admin) {
    return {
      ok: false,
      error: "Solo un superadmin puede modificar administradores.",
    };
  }

  return { ok: true };
}

async function countSuperadmins(supabase: SupabaseClient): Promise<number> {
  const { count } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("app_role", "superadmin")
    .eq("is_suspended", false);

  return count ?? 0;
}

export async function suspendUser(
  supabase: SupabaseClient,
  actorId: string,
  actorRole: AppRole,
  targetId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: target } = await supabase
    .from("profiles")
    .select("id, app_role")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) return { ok: false, error: "Usuario no encontrado." };

  const guard = canAdminActOnUser(
    actorId,
    actorRole,
    targetId,
    target.app_role as AppRole
  );
  if (!guard.ok) return guard;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: true,
      suspended_at: now,
      suspended_reason: reason.trim() || null,
    })
    .eq("id", targetId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction(supabase, {
    actorId,
    action: "suspend_user",
    entityType: "profile",
    entityId: targetId,
    metadata: { reason: reason.trim() || null },
  });

  return { ok: true };
}

export async function unsuspendUser(
  supabase: SupabaseClient,
  actorId: string,
  actorRole: AppRole,
  targetId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: target } = await supabase
    .from("profiles")
    .select("id, app_role")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) return { ok: false, error: "Usuario no encontrado." };

  const guard = canAdminActOnUser(
    actorId,
    actorRole,
    targetId,
    target.app_role as AppRole
  );
  if (!guard.ok) return guard;

  const { error } = await supabase
    .from("profiles")
    .update({
      is_suspended: false,
      suspended_at: null,
      suspended_reason: null,
    })
    .eq("id", targetId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction(supabase, {
    actorId,
    action: "unsuspend_user",
    entityType: "profile",
    entityId: targetId,
  });

  return { ok: true };
}

export async function assignUserRole(
  supabase: SupabaseClient,
  actorId: string,
  actorRole: AppRole,
  targetId: string,
  newRole: AppRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (actorRole !== "superadmin") {
    return { ok: false, error: "Solo superadmin puede asignar roles." };
  }

  if (!VALID_ROLES.includes(newRole)) {
    return { ok: false, error: "Rol inválido." };
  }

  const { data: target } = await supabase
    .from("profiles")
    .select("id, app_role")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) return { ok: false, error: "Usuario no encontrado." };

  if (actorId === targetId) {
    return { ok: false, error: "No podés cambiar tu propio rol." };
  }

  const currentRole = target.app_role as AppRole;

  if (currentRole === "superadmin" && newRole !== "superadmin") {
    const superCount = await countSuperadmins(supabase);
    if (superCount <= 1) {
      return {
        ok: false,
        error: "No se puede quitar el único superadmin activo.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ app_role: newRole })
    .eq("id", targetId);

  if (error) return { ok: false, error: error.message };

  await logAdminAction(supabase, {
    actorId,
    action: "assign_role",
    entityType: "profile",
    entityId: targetId,
    metadata: { from: currentRole, to: newRole },
  });

  return { ok: true };
}

export function actorCanAssignRoles(role: AppRole): boolean {
  return role === "superadmin";
}

export function actorCanManageTarget(
  actorRole: AppRole,
  targetRole: AppRole
): boolean {
  if (actorRole === "superadmin") return true;
  return !hasMinRole(targetRole, "admin");
}
