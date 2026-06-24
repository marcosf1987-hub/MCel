import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import {
  assignUserRole,
  suspendUser,
  unsuspendUser,
} from "@/lib/admin/users-admin";
import type { AppRole } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: userId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();
  const actorRole = session.profile.app_role as AppRole;

  if (body.unsuspend === true) {
    const result = await unsuspendUser(
      supabase,
      session.userId,
      actorRole,
      userId
    );
    if (!result.ok) {
      return withAdminCookies(
        response,
        adminJson({ ok: false, error: result.error }, 400)
      );
    }
    return withAdminCookies(response, adminJson({ ok: true }));
  }

  if (body.suspend === true) {
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";
    const result = await suspendUser(
      supabase,
      session.userId,
      actorRole,
      userId,
      reason
    );
    if (!result.ok) {
      return withAdminCookies(
        response,
        adminJson({ ok: false, error: result.error }, 400)
      );
    }
    return withAdminCookies(response, adminJson({ ok: true }));
  }

  if (typeof body.app_role === "string") {
    const result = await assignUserRole(
      supabase,
      session.userId,
      actorRole,
      userId,
      body.app_role as AppRole
    );
    if (!result.ok) {
      return withAdminCookies(
        response,
        adminJson({ ok: false, error: result.error }, 403)
      );
    }
    return withAdminCookies(response, adminJson({ ok: true }));
  }

  return withAdminCookies(
    response,
    adminJson({ ok: false, error: "Acción inválida." }, 400)
  );
}
