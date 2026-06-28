import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import { slugify } from "@/lib/utils";
import { notifyModerationAction } from "@/lib/user-notifications";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: productId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();

  const { data: existing } = await supabase
    .from("products")
    .select("id, name, slug, barcode, brand_id, created_by")
    .eq("id", productId)
    .maybeSingle();

  if (!existing) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Producto no encontrado." }, 404)
    );
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim()) {
    updates.name = body.name.trim();
    const brandName =
      typeof body.brandName === "string"
        ? body.brandName
        : undefined;
    let slug = slugify(
      `${brandName ?? "producto"}-${updates.name as string}`
    );
    const { data: conflict } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .neq("id", productId)
      .maybeSingle();
    if (conflict) slug = `${slug}-${existing.barcode.slice(-6)}`;
    updates.slug = slug;
  }

  if (typeof body.barcode === "string" && body.barcode.trim()) {
    updates.barcode = body.barcode.trim();
  }
  if (typeof body.brand_id === "string") updates.brand_id = body.brand_id;
  if (typeof body.category_id === "string") updates.category_id = body.category_id;
  if (typeof body.subcategory_id === "string") {
    updates.subcategory_id = body.subcategory_id;
  }

  if (body.restore === true) {
    updates.deleted_at = null;
  } else if (body.hide === true) {
    updates.deleted_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Sin cambios." }, 400)
    );
  }

  const { error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId);

  if (error) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: error.message }, 500)
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: body.hide ? "hide_product" : body.restore ? "restore_product" : "update_product",
    entityType: "product",
    entityId: productId,
    metadata: updates,
  });

  if (body.hide === true) {
    await notifyModerationAction(supabase, {
      actorId: session.userId,
      targetType: "product",
      targetId: productId,
      action: "hidden",
    });
  } else if (body.restore === true) {
    await notifyModerationAction(supabase, {
      actorId: session.userId,
      targetType: "product",
      targetId: productId,
      action: "restored",
    });
  }

  return withAdminCookies(response, adminJson({ ok: true }));
}
