import { NextRequest, NextResponse } from "next/server";
import {
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { buildGdprExport } from "@/lib/admin/users-server";
import { logAdminAction } from "@/lib/admin/audit-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { id: userId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;

  const exportData = await buildGdprExport(supabase, userId);
  if (!exportData) {
    return withAdminCookies(
      response,
      NextResponse.json(
        { ok: false, error: "Usuario no encontrado." },
        { status: 404 }
      )
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: "gdpr_export",
    entityType: "profile",
    entityId: userId,
  });

  const filename = `gdpr-export-${userId.slice(0, 8)}-${exportData.exported_at.slice(0, 10)}.json`;
  const json = JSON.stringify(exportData, null, 2);

  const result = new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });

  return withAdminCookies(response, result);
}
