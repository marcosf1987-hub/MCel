import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import { hideModerationTarget } from "@/lib/admin/moderation";
import type { Report } from "@/types/database";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: reportId } = await context.params;
  const auth = await getAdminSupabase(request, "moderator");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;

  const body = await request.json();
  const status = body.status as Report["status"];
  const moderatorNote =
    typeof body.moderatorNote === "string" ? body.moderatorNote.trim() : "";
  const hideContent = Boolean(body.hideContent);

  if (status !== "resolved" && status !== "dismissed") {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Estado inválido." }, 400)
    );
  }

  const { data: report } = await supabase
    .from("reports")
    .select("id, status, target_type, target_id")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Reporte no encontrado." }, 404)
    );
  }

  if (report.status !== "pending") {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "El reporte ya fue procesado." }, 409)
    );
  }

  if (hideContent && status === "resolved") {
    const hideResult = await hideModerationTarget(
      supabase,
      session.userId,
      report.target_type as "product" | "review" | "list" | "list_comment",
      report.target_id,
      { report_id: reportId, moderator_note: moderatorNote || null }
    );
    if (!hideResult.ok) {
      return withAdminCookies(
        response,
        adminJson({ ok: false, error: hideResult.error }, 500)
      );
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("reports")
    .update({
      status,
      resolved_by: session.userId,
      resolved_at: now,
      moderator_note: moderatorNote || null,
    })
    .eq("id", reportId);

  if (error) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: error.message }, 500)
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: status === "resolved" ? "resolve_report" : "dismiss_report",
    entityType: "report",
    entityId: reportId,
    metadata: {
      target_type: report.target_type,
      target_id: report.target_id,
      hide_content: hideContent,
      moderator_note: moderatorNote || null,
    },
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}
