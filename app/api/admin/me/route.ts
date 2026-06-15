import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { requireRole } from "@/lib/auth/session-profile";
import { APP_ROLE_LABELS } from "@/lib/auth/roles";
import type { AppRole } from "@/types/database";

export async function GET(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return NextResponse.json({ ok: false, error: env.error }, { status: 500 });
  }

  const response = NextResponse.next();
  const supabase = createClientFromRequest(request, response);
  const auth = await requireRole(supabase, "moderator");

  if (!auth.ok) {
    const status =
      auth.reason === "unauthenticated" ? 401 : auth.reason === "suspended" ? 403 : 403;
    const error =
      auth.reason === "unauthenticated"
        ? "Sesión requerida."
        : auth.reason === "suspended"
          ? "Cuenta suspendida."
          : "Sin permisos de administración.";

    const result = NextResponse.json({ ok: false, error, reason: auth.reason }, { status });
    response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
    return result;
  }

  const role = auth.session.profile.app_role as AppRole;
  const result = NextResponse.json({
    ok: true,
    profile: {
      id: auth.session.profile.id,
      display_name: auth.session.profile.display_name,
      email: auth.session.profile.email,
      app_role: role,
      role_label: APP_ROLE_LABELS[role],
      is_suspended: auth.session.profile.is_suspended,
    },
  });
  response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
  return result;
}
