import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { fetchPendingPlaces } from "@/lib/places-server";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "moderator");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const places = await fetchPendingPlaces(supabase);
  return withAdminCookies(response, adminJson({ ok: true, places }));
}
