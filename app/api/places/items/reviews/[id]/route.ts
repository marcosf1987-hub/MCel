import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  updatePlaceItemReviewSchema,
  zodErrorMessage,
} from "@/lib/validation/api-schemas";

type RouteContext = { params: Promise<{ id: string }> };

/** id = place_item_reviews.id */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const json = (body: object, status = 200, headers?: HeadersInit) =>
    NextResponse.json(body, { status, headers });

  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) return json({ ok: false, error: env.error }, 500);

    const response = NextResponse.next();
    const supabase = createClientFromRequest(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json(
        { ok: false, error: "Necesitás iniciar sesión.", needsLogin: true },
        401
      );
    }

    const limited = rateLimit(
      `place-item-reviews:patch:${user.id}:${clientIp(request)}`,
      15,
      60_000
    );
    if (!limited.ok) {
      const r = rateLimitResponse(limited.retryAfterSec);
      return json(r.body, r.status, r.headers);
    }

    const parsed = updatePlaceItemReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
    }

    const { data: existing } = await supabase
      .from("place_item_reviews")
      .select("id, user_id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) {
      return json({ ok: false, error: "Valoración no encontrada." }, 404);
    }
    if (existing.user_id !== user.id) {
      return json({ ok: false, error: "No podés editar esta valoración." }, 403);
    }

    const { error } = await supabase
      .from("place_item_reviews")
      .update({
        rating: parsed.data.rating,
        opinion: parsed.data.opinion?.trim() || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    console.error("place item review patch:", e);
    return json({ ok: false, error: "Error al actualizar." }, 500);
  }
}
