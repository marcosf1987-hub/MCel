import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import { slugify } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: brandId } = await context.params;
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
  const { error } = await supabase
    .from("brands")
    .update({ name, slug })
    .eq("id", brandId);

  if (error) {
    const msg =
      error.code === "23505"
        ? "Ya existe una marca con ese slug."
        : error.message;
    return withAdminCookies(response, adminJson({ ok: false, error: msg }, 500));
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "update_brand",
    entityType: "brand",
    entityId: brandId,
    metadata: { name, slug },
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: brandId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("brand_id", brandId)
    .is("deleted_at", null);

  if ((count ?? 0) > 0) {
    return withAdminCookies(
      response,
      adminJson(
        { ok: false, error: "No se puede borrar: tiene productos activos." },
        409
      )
    );
  }

  const { error } = await supabase.from("brands").delete().eq("id", brandId);

  if (error) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: error.message }, 500)
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "delete_brand",
    entityType: "brand",
    entityId: brandId,
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}
