export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return {
      ok: false as const,
      error:
        "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. En Vercel: Settings → Environment Variables, guardá y hacé Redeploy.",
    };
  }

  if (!url.startsWith("https://")) {
    return {
      ok: false as const,
      error:
        "NEXT_PUBLIC_SUPABASE_URL debe empezar con https:// (copiá Project URL de Supabase → Settings → API).",
    };
  }

  return { ok: true as const, url, anonKey };
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
