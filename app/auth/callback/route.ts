import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { safeReturnUrl } from "@/lib/safe-return-url";

function originFromRequest(request: NextRequest): string {
  // Preferir el host real (www / apex / vercel) para no romper cookies PKCE
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const safeReturn = safeReturnUrl(searchParams.get("returnUrl"));
  const origin = originFromRequest(request);

  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(env.error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback`);
  }

  const successRedirect = NextResponse.redirect(`${origin}${safeReturn}`);
  const supabase = createClientFromRequest(request, successRedirect);

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`
      );
    }
    if (data.user) {
      await ensureProfile(
        data.user.id,
        data.user.email,
        data.user.user_metadata
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "auth_error";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(msg)}`
    );
  }

  return successRedirect;
}
