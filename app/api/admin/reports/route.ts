import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { fetchEnrichedReports } from "@/lib/admin/reports-server";
import type { Report } from "@/types/database";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "moderator");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const statusParam = request.nextUrl.searchParams.get("status") ?? "pending";
  const status = (
    ["pending", "resolved", "dismissed", "all"].includes(statusParam)
      ? statusParam
      : "pending"
  ) as Report["status"] | "all";

  const reports = await fetchEnrichedReports(supabase, status);
  const result = adminJson({ ok: true, reports });
  return withAdminCookies(response, result);
}
