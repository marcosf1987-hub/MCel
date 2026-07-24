type Bucket = { timestamps: number[] };

const store = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

/**
 * Rate limit en memoria del proceso (útil contra ráfagas; en serverless
 * no es global entre isolates, pero reduce abuso básico).
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    store.set(key, bucket);
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return { ok: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  store.set(key, bucket);

  // Evitar crecimiento infinito de keys
  if (store.size > 5000) {
    const cutoff = now - windowMs * 2;
    for (const [k, b] of store) {
      b.timestamps = b.timestamps.filter((t) => t > cutoff);
      if (b.timestamps.length === 0) store.delete(k);
    }
  }

  return { ok: true, remaining: limit - bucket.timestamps.length };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimitResponse(retryAfterSec: number) {
  return {
    body: {
      ok: false as const,
      error: "Demasiadas solicitudes. Probá de nuevo en un momento.",
    },
    status: 429,
    headers: { "Retry-After": String(retryAfterSec) },
  };
}
