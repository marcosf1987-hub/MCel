import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import { fetchAdminBrands } from "@/lib/admin/catalog-server";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response } = auth;
  const brands = await fetchAdminBrands(supabase);
  return withAdminCookies(response, adminJson({ ok: true, brands }));
}

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Nombre requerido." }, 400)
    );
  }

  const slug = slugify(name);
  const { data, error } = await supabase
    .from("brands")
    .insert({ name, slug })
    .select("id, name, slug, created_at")
    .single();

  if (error) {
    const msg =
      error.code === "23505"
        ? "Ya existe una marca con ese nombre."
        : error.message;
    return withAdminCookies(response, adminJson({ ok: false, error: msg }, 500));
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "create_brand",
    entityType: "brand",
    entityId: data.id,
    metadata: { name, slug },
  });

  return withAdminCookies(response, adminJson({ ok: true, brand: data }));
}
