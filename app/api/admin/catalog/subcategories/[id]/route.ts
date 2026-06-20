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
  const { id: subcategoryId } = await context.params;
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

  const updates: Record<string, unknown> = {
    name,
    slug: slugify(name),
  };
  if (typeof body.name_es === "string") {
    updates.name_es = body.name_es.trim() || null;
  }

  const { error } = await supabase
    .from("subcategories")
    .update(updates)
    .eq("id", subcategoryId);

  if (error) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: error.message }, 500)
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "update_subcategory",
    entityType: "subcategory",
    entityId: subcategoryId,
    metadata: updates,
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: subcategoryId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("subcategory_id", subcategoryId)
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

  const { error } = await supabase
    .from("subcategories")
    .delete()
    .eq("id", subcategoryId);

  if (error) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: error.message }, 500)
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "delete_subcategory",
    entityType: "subcategory",
    entityId: subcategoryId,
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}
