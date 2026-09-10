"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/supabase/ensure-profile";
import {
  getSupabasePublicEnv,
  originFromHeaders,
} from "@/lib/supabase/env";
import { safeReturnUrl } from "@/lib/safe-return-url";

export async function signUpWithEmail(
  email: string,
  password: string,
  returnUrl: string
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const env = getSupabasePublicEnv();
  if (!env.ok) return { ok: false, error: env.error };

  const supabase = await createClient();
  const hdrs = await headers();
  const siteUrl = originFromHeaders(hdrs);
  const safeReturn = safeReturnUrl(returnUrl);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?returnUrl=${encodeURIComponent(safeReturn)}`,
    },
  });

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    message:
      "Revisá tu email para confirmar la cuenta. Si no llega, revisá spam o desactivá la confirmación en Supabase → Authentication → Providers → Email.",
  };
}

export async function signInWithEmail(
  email: string,
  password: string,
  returnUrl: string
): Promise<{ ok: false; error: string } | void> {
  const env = getSupabasePublicEnv();
  if (!env.ok) return { ok: false, error: env.error };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { ok: false, error: error.message };

  if (data.user) {
    await ensureProfile(data.user.id, data.user.email, data.user.user_metadata);
  }

  redirect(safeReturnUrl(returnUrl));
}

/**
 * OAuth en server action: setea code verifier en cookies del response.
 * redirectTo usa el host real de la pestaña (www/apex), no SITE_URL fijo.
 */
export async function getGoogleSignInUrl(
  returnUrl: string
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const env = getSupabasePublicEnv();
  if (!env.ok) return { ok: false, error: env.error };

  const supabase = await createClient();
  const hdrs = await headers();
  const origin = originFromHeaders(hdrs);
  const safeReturn = safeReturnUrl(returnUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?returnUrl=${encodeURIComponent(safeReturn)}`,
      skipBrowserRedirect: true,
    },
  });

  if (error) return { ok: false, error: error.message };
  if (!data.url) {
    return { ok: false, error: "No se pudo iniciar sesión con Google." };
  }

  return { ok: true, url: data.url };
}
