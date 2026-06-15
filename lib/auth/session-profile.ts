import type { SupabaseClient } from "@supabase/supabase-js";
import { hasMinRole } from "@/lib/auth/roles";
import type { AppRole } from "@/types/database";

export type SessionProfile = {
  id: string;
  app_role: AppRole;
  is_suspended: boolean;
  display_name: string | null;
  email?: string | null;
};

export async function getSessionProfile(
  supabase: SupabaseClient
): Promise<{ userId: string; profile: SessionProfile } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, app_role, is_suspended, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    userId: user.id,
    profile: {
      id: profile.id,
      app_role: profile.app_role as AppRole,
      is_suspended: profile.is_suspended,
      display_name: profile.display_name,
      email: user.email,
    },
  };
}

export type RequireRoleResult =
  | { ok: true; session: { userId: string; profile: SessionProfile } }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "suspended" };

export async function requireRole(
  supabase: SupabaseClient,
  minimum: AppRole
): Promise<RequireRoleResult> {
  const session = await getSessionProfile(supabase);
  if (!session) return { ok: false, reason: "unauthenticated" };
  if (session.profile.is_suspended) return { ok: false, reason: "suspended" };
  if (!hasMinRole(session.profile.app_role, minimum)) {
    return { ok: false, reason: "forbidden" };
  }
  return { ok: true, session };
}
