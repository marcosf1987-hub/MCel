import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { nominatimReverse, nominatimSearch } from "@/lib/nominatim";

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { response, session } = auth;
  const rl = rateLimit(
    `nominatim:admin:${session.userId}:${clientIp(request)}`,
    30,
    60_000
  );
  if (!rl.ok) {
    const limited = rateLimitResponse(rl.retryAfterSec);
    const res = adminJson(limited.body, limited.status);
    res.headers.set("Retry-After", String(rl.retryAfterSec));
    return withAdminCookies(response, res);
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.mode === "reverse" ? "reverse" : "search";

  if (mode === "reverse") {
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const result = await nominatimReverse(lat, lng);
    if (!result.ok) {
      return withAdminCookies(
        response,
        adminJson(
          { ok: false, error: result.error },
          result.status && result.status >= 400 ? result.status : 502
        )
      );
    }
    return withAdminCookies(
      response,
      adminJson({ ok: true, result: result.result })
    );
  }

  const query = typeof body.query === "string" ? body.query : "";
  const result = await nominatimSearch(query, 6);
  if (!result.ok) {
    return withAdminCookies(
      response,
      adminJson(
        { ok: false, error: result.error },
        result.status && result.status >= 400 ? result.status : 502
      )
    );
  }

  return withAdminCookies(
    response,
    adminJson({ ok: true, results: result.results })
  );
}
