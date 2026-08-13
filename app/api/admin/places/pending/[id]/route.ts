import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import { logAdminAction } from "@/lib/admin/audit-log";
import { createUserNotification } from "@/lib/user-notifications";

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

  const { data: place, error: fetchError } = await supabase
    .from("places")
    .select("id, name, slug, created_by, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !place) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Local no encontrado." }, 404)
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

  if (place.created_by) {
    if (action === "publish") {
      await createUserNotification(supabase, {
        userId: place.created_by,
        actorId: session.userId,
        type: "place_published",
        title: "Local publicado",
        message: `Tu propuesta “${place.name}” ya está visible en el mapa.`,
        linkHref: `/locales/${place.slug}`,
      });
    } else {
      await createUserNotification(supabase, {
        userId: place.created_by,
        actorId: session.userId,
        type: "place_rejected",
        title: "Local no aprobado",
        message: `Tu propuesta “${place.name}” fue rechazada. Motivo: ${note}`,
        linkHref: "/locales/mis-propuestas",
      });
    }
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
