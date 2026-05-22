export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return {
      ok: false as const,
      error:
        "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. En Vercel: Settings → Environment Variables, guardá y hacé Redeploy.",
    };
  }

  if (!url.startsWith("https://") || !url.includes("supabase.co")) {
    return {
      ok: false as const,
      error:
        "NEXT_PUBLIC_SUPABASE_URL no parece válida. Debe ser como https://xxxxx.supabase.co (copiada de Supabase → Settings → API).",
    };
  }

  return { ok: true as const, url, anonKey };
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}
