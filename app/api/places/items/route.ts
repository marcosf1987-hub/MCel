import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  createPlaceItemSchema,
  createPlaceItemReviewSchema,
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

    const body = await request.json();
    const asReview = body.placeItemId != null || body.mode === "review";

    if (asReview) {
      const limited = rateLimit(
        `place-item-reviews:${user.id}:${clientIp(request)}`,
        15,
        60_000
      );
      if (!limited.ok) {
        const r = rateLimitResponse(limited.retryAfterSec);
        return json(r.body, r.status, r.headers);
      }

      const parsed = createPlaceItemReviewSchema.safeParse(body);
      if (!parsed.success) {
        return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
      }

      const { placeItemId, rating, opinion } = parsed.data;

      const { data: item } = await supabase
        .from("place_items")
        .select("id")
        .eq("id", placeItemId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!item) {
        return json({ ok: false, error: "Ítem no encontrado." }, 404);
      }

      const { data: existing } = await supabase
        .from("place_item_reviews")
        .select("id")
        .eq("place_item_id", placeItemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        return json({ ok: false, error: "Ya evaluaste este ítem." }, 409);
      }

      const { error } = await supabase.from("place_item_reviews").insert({
        place_item_id: placeItemId,
        user_id: user.id,
        rating,
        opinion: opinion?.trim() || null,
      });

      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true });
    }

    const limited = rateLimit(
      `place-items:${user.id}:${clientIp(request)}`,
      15,
      60_000
    );
    if (!limited.ok) {
      const r = rateLimitResponse(limited.retryAfterSec);
      return json(r.body, r.status, r.headers);
    }

    const parsed = createPlaceItemSchema.safeParse(body);
    if (!parsed.success) {
      return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
    }

    const { placeId, name, description } = parsed.data;

    const { data: place } = await supabase
      .from("places")
      .select("id")
      .eq("id", placeId)
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (!place) {
      return json({ ok: false, error: "Local no encontrado." }, 404);
    }

    const { data, error } = await supabase
      .from("place_items")
      .insert({
        place_id: placeId,
        name: name.trim(),
        description: description?.trim() || null,
        created_by: user.id,
      })
      .select(
        "id, place_id, name, description, created_by, deleted_at, weighted_rating, review_count, created_at, updated_at"
      )
      .single();

    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, item: data });
  } catch (e) {
    console.error("place items:", e);
    return json({ ok: false, error: "Error al guardar." }, 500);
  }
}
