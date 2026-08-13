import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  createPlaceReviewSchema,
  zodErrorMessage,
} from "@/lib/validation/api-schemas";

export async function POST(request: NextRequest) {
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
      `place-reviews:${user.id}:${clientIp(request)}`,
      10,
      60_000
    );
    if (!limited.ok) {
      const r = rateLimitResponse(limited.retryAfterSec);
      return json(r.body, r.status, r.headers);
    }

    const parsed = createPlaceReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
    }

    const { placeId, rating, opinion } = parsed.data;

    const { data: place } = await supabase
      .from("places")
      .select("id, status")
      .eq("id", placeId)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (!place) {
      return json({ ok: false, error: "Local no encontrado." }, 404);
    }

    const { data: existing } = await supabase
      .from("place_reviews")
      .select("id")
      .eq("place_id", placeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return json({ ok: false, error: "Ya evaluaste este local." }, 409);
    }

    const { data, error } = await supabase
      .from("place_reviews")
      .insert({
        place_id: placeId,
        user_id: user.id,
        rating,
        opinion,
      })
      .select("id")
      .single();

    if (error) {
      return json({ ok: false, error: error.message }, 500);
    }

    return json({ ok: true, reviewId: data.id });
  } catch (e) {
    console.error("place review:", e);
    return json({ ok: false, error: "Error al guardar la evaluación." }, 500);
  }
}
