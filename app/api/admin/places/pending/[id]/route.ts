import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getAdminSupabase(request, "moderator");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json().catch(() => ({}));
  const action = body.action as string;
  const note =
    typeof body.rejection_note === "string" ? body.rejection_note.trim() : null;

  if (action !== "publish" && action !== "reject") {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Acción inválida." }, 400)
    );
  }

  if (action === "reject" && !note) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Indicá un motivo de rechazo." }, 400)
    );
  }

  const updates =
    action === "publish"
      ? {
          status: "published" as const,
          rejection_note: null,
          reviewed_by: session.userId,
          reviewed_at: new Date().toISOString(),
        }
      : {
          status: "rejected" as const,
          rejection_note: note,
          reviewed_by: session.userId,
          reviewed_at: new Date().toISOString(),
        };

  const { error } = await supabase.from("places").update(updates).eq("id", id);

  if (error) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: error.message }, 500)
    );
  }

  await logAdminAction(supabase, {
    actorId: session.userId,
    action: action === "publish" ? "publish_place" : "reject_place",
    entityType: "place",
    entityId: id,
    metadata: updates,
  });

  return withAdminCookies(response, adminJson({ ok: true }));
}
