import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { mergeBrands } from "@/lib/admin/catalog-merge";

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();

  const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
  const targetId = typeof body.targetId === "string" ? body.targetId : "";

  if (!sourceId || !targetId) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Faltan marcas origen y destino." }, 400)
    );
  }

  const result = await mergeBrands(
    supabase,
    session.userId,
    sourceId,
    targetId
  );

  if (!result.ok) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: result.error }, 400)
    );
  }

  return withAdminCookies(
    response,
    adminJson({
      ok: true,
      summary: result.summary,
      targetSlug: result.targetSlug,
    })
  );
}
