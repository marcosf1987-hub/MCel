import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { fetchAdminAnalytics } from "@/lib/admin/analytics-server";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "moderator");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const range = request.nextUrl.searchParams.get("range") ?? "30d";
  const analytics = await fetchAdminAnalytics(supabase, range);

  return withAdminCookies(response, adminJson({ ok: true, analytics }));
}
