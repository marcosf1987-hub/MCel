import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { fetchAdminUsers } from "@/lib/admin/users-server";
import type { AppRole } from "@/types/database";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const roleParam = request.nextUrl.searchParams.get("role") ?? "all";
  const suspendedParam =
    request.nextUrl.searchParams.get("suspended") ?? "all";

  const role = (
    ["user", "moderator", "admin", "superadmin", "all"].includes(roleParam)
      ? roleParam
      : "all"
  ) as AppRole | "all";

  const suspended = (
    ["all", "yes", "no"].includes(suspendedParam) ? suspendedParam : "all"
  ) as "all" | "yes" | "no";

  const users = await fetchAdminUsers(supabase, { q, role, suspended });

  return withAdminCookies(response, adminJson({ ok: true, users }));
}
