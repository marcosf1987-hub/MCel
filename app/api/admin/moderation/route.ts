import { NextRequest } from "next/server";
import {
  adminJson,
  getAdminSupabase,
  withAdminCookies,
} from "@/lib/api/admin-auth";
import {
  hideModerationTarget,
  restoreModerationTarget,
  type ModerationTargetType,
} from "@/lib/admin/moderation";

const VALID_TYPES = new Set<ModerationTargetType>([
  "product",
  "review",
  "list",
  "list_comment",
]);

export async function POST(request: NextRequest) {
  const auth = await getAdminSupabase(request, "moderator");
  if ("error" in auth && auth.error) return auth.error;

  const { supabase, response, session } = auth;
  const body = await request.json();
  const targetType = body.targetType as ModerationTargetType;
  const targetId = String(body.targetId ?? "");
  const action = body.action as "hide" | "restore";

  if (!VALID_TYPES.has(targetType) || !targetId) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: "Datos inválidos." }, 400)
    );
  }

  const result =
    action === "restore"
      ? await restoreModerationTarget(supabase, session.userId, targetType, targetId)
      : await hideModerationTarget(supabase, session.userId, targetType, targetId, {
          source: "admin_moderation_panel",
        });

  if (!result.ok) {
    return withAdminCookies(
      response,
      adminJson({ ok: false, error: result.error }, 500)
    );
  }

  return withAdminCookies(response, adminJson({ ok: true }));
}
