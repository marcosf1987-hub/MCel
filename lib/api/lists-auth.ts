import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export function listJson(body: object, status = 200) {
  return NextResponse.json(body, { status });
}

export async function getAuthedSupabase(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return { error: listJson({ ok: false, error: env.error }, 500) as NextResponse };
  }

  const response = NextResponse.next();
  const supabase = createClientFromRequest(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: listJson(
        { ok: false, error: "Tenés que iniciar sesión.", needsLogin: true },
        401
      ) as NextResponse,
    };
  }

  return { supabase, user, response };
}

export function withCookies(
  response: NextResponse,
  result: NextResponse
) {
  response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
  return result;
}
