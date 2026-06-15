import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { requireRole } from "@/lib/auth/session-profile";
import type { AppRole } from "@/types/database";

export function adminJson(body: object, status = 200) {
  return NextResponse.json(body, { status });
}

export function withAdminCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((c) => target.cookies.set(c.name, c.value));
  return target;
}

export async function getAdminSupabase(
  request: NextRequest,
  minimum: AppRole = "moderator"
) {
  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return { error: adminJson({ ok: false, error: env.error }, 500) as NextResponse };
  }

  const response = NextResponse.next();
  const supabase = createClientFromRequest(request, response);
  const auth = await requireRole(supabase, minimum);

  if (!auth.ok) {
    const status =
      auth.reason === "unauthenticated" ? 401 : 403;
    const error =
      auth.reason === "unauthenticated"
        ? "Sesión requerida."
        : auth.reason === "suspended"
          ? "Cuenta suspendida."
          : "Sin permisos de administración.";

    return {
      error: withAdminCookies(
        response,
        adminJson({ ok: false, error, reason: auth.reason }, status)
      ) as NextResponse,
    };
  }

  return { supabase, response, session: auth.session };
}
