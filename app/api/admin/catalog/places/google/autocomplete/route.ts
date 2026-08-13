import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import {
  googlePlacesAutocomplete,
  isGooglePlacesConfigured,
  newPlacesSessionToken,
} from "@/lib/google-places";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { response } = auth;
  return withAdminCookies(
    response,
    adminJson({
      ok: true,
      configured: isGooglePlacesConfigured(),
      sessionToken: newPlacesSessionToken(),
    })
  );
}

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { response } = auth;
  const body = await request.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input : "";
  const sessionToken =
    typeof body.sessionToken === "string" && body.sessionToken.trim()
      ? body.sessionToken.trim()
      : newPlacesSessionToken();

  const result = await googlePlacesAutocomplete(input, sessionToken);
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
    adminJson({
      ok: true,
      suggestions: result.suggestions,
      sessionToken,
    })
  );
}
