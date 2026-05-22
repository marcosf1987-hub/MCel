import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl, getSupabasePublicEnv } from "@/lib/supabase/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const returnUrl = searchParams.get("returnUrl") ?? "/";
  const siteUrl = getSiteUrl();
  const safeReturn = returnUrl.startsWith("/") ? returnUrl : "/";

  const env = getSupabasePublicEnv();
  if (!env.ok) {
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(env.error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=auth_callback`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${siteUrl}/login?error=${encodeURIComponent(error.message)}`
      );
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "auth_error";
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(msg)}`
    );
  }

  return NextResponse.redirect(`${siteUrl}${safeReturn}`);
}
