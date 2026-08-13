import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { nominatimReverse, nominatimSearch } from "@/lib/nominatim";

/** Geocode para usuarios autenticados (proponer local). */
export async function POST(request: NextRequest) {
  const json = (body: object, status = 200, headers?: HeadersInit) =>
    NextResponse.json(body, { status, headers });

  const env = getSupabasePublicEnv();
  if (!env.ok) return json({ ok: false, error: env.error }, 500);

  const response = NextResponse.next();
  const supabase = createClientFromRequest(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return json({ ok: false, error: "Necesitás iniciar sesión.", needsLogin: true }, 401);
  }

  const limited = rateLimit(
    `nominatim:user:${user.id}:${clientIp(request)}`,
    20,
    60_000
  );
  if (!limited.ok) {
    const r = rateLimitResponse(limited.retryAfterSec);
    return json(r.body, r.status, r.headers);
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === "reverse" ? "reverse" : "search";

  if (mode === "reverse") {
    const result = await nominatimReverse(Number(body.lat), Number(body.lng));
    if (!result.ok) {
      return json(
        { ok: false, error: result.error },
        result.status && result.status >= 400 ? result.status : 502
      );
    }
    return json({ ok: true, result: result.result });
  }

  const query = typeof body.query === "string" ? body.query : "";
  const result = await nominatimSearch(query, 6);
  if (!result.ok) {
    return json(
      { ok: false, error: result.error },
      result.status && result.status >= 400 ? result.status : 502
    );
  }
  return json({ ok: true, results: result.results });
}
