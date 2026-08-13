import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { googlePlaceDetails } from "@/lib/google-places";

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { response } = auth;
  const body = await request.json().catch(() => ({}));
  const placeId = typeof body.placeId === "string" ? body.placeId.trim() : "";
  const sessionToken =
    typeof body.sessionToken === "string" ? body.sessionToken.trim() : undefined;

  if (!placeId) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "placeId requerido." }, 400)
    );
  }

  const result = await googlePlaceDetails(placeId, sessionToken || undefined);
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
    adminJson({ ok: true, place: result.place })
  );
}
