import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import {
  applyImageAdminAction,
  type ImageAdminAction,
} from "@/lib/admin/images-admin";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_ACTIONS = new Set<ImageAdminAction>([
  "approve_cover",
  "hide",
  "dismiss_review",
]);

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: imageId } = await context.params;
  const auth = await getAdminSupabase(request, "admin");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();
  const action = body.action as ImageAdminAction;

  if (!VALID_ACTIONS.has(action)) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Acción inválida." }, 400)
    );
  }

  const result = await applyImageAdminAction(
    supabase,
    session.userId,
    imageId,
    action
  );

  if (!result.ok) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: result.error }, 500)
    );
  }

  return withAdminCookies(response, adminJson({ ok: true }));
}
