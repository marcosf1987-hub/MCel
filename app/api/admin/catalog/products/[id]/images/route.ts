import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { fetchAdminProductImages } from "@/lib/admin/catalog-server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: productId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (!product) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Producto no encontrado." }, 404)
    );
  }

  const images = await fetchAdminProductImages(supabase, productId);

  return withAdminCookies(response, adminJson({ ok: true, images }));
}
