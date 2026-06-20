import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();
  const categoryId =
    typeof body.category_id === "string" ? body.category_id : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const nameEs =
    typeof body.name_es === "string" ? body.name_es.trim() || null : null;

  if (!categoryId || !name) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Categoría y nombre requeridos." }, 400)
    );
  }

  const slug = slugify(name);
  const { data, error } = await supabase
    .from("subcategories")
    .insert({ category_id: categoryId, name, name_es: nameEs, slug })
    .select("*")
    .single();

  if (error) {
    const msg =
      error.code === "23505"
        ? "Ya existe esa subcategoría en la categoría."
        : error.message;
    return withAdminCookies(response, adminJson({ ok: false, error: msg }, 500));
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "create_subcategory",
    entityType: "subcategory",
    entityId: data.id,
    metadata: { category_id: categoryId, name, slug },
  });

  return withAdminCookies(response, adminJson({ ok: true, subcategory: data }));
}
