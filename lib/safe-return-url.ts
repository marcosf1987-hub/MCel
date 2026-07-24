/**
 * Path relativo seguro para post-login (bloquea //evil.com y URLs absolutas).
 */
export function safeReturnUrl(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (raw == null) return fallback;

  const trimmed = raw.trim();
  if (!trimmed) return fallback;

  // Relativo: un solo slash inicial; no protocol-relative
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || trimmed.includes("\0")) return fallback;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed.slice(1))) return fallback;

  try {
    const base = "https://local.invalid";
    const parsed = new URL(trimmed, base);
    if (parsed.origin !== base) return fallback;
    const out = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return out.startsWith("/") && !out.startsWith("//") ? out : fallback;
  } catch {
    return fallback;
  }
}
