import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { fetchReviewImages } from "@/lib/admin/catalog-server";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const images = await fetchReviewImages(supabase);
  return withAdminCookies(response, adminJson({ ok: true, images }));
}
