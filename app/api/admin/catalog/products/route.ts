import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { fetchAdminProducts } from "@/lib/admin/catalog-server";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const includeDeleted =
    request.nextUrl.searchParams.get("deleted") === "true";

  const products = await fetchAdminProducts(supabase, {
    q,
    includeDeleted,
  });

  return withAdminCookies(response, adminJson({ ok: true, products }));
}
