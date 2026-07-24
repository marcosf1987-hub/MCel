import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { refreshProductAiSummary } from "@/lib/ai/refresh-product-summary";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  updateReviewSchema,
  uuidSchema,
  zodErrorMessage,
} from "@/lib/validation/api-schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id: reviewId } = await context.params;
  return handleUpdate(request, reviewId);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id: reviewId } = await context.params;
  return handleUpdate(request, reviewId);
}

async function handleUpdate(request: NextRequest, reviewId: string) {
  const json = (body: object, status = 200, headers?: HeadersInit) =>
    NextResponse.json(body, { status, headers });

  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) return json({ ok: false, error: env.error }, 500);

    if (!uuidSchema.safeParse(reviewId).success) {
      return json({ ok: false, error: "ID inválido." }, 400);
    }

    const response = NextResponse.next();
    const supabase = createClientFromRequest(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return json({ ok: false, error: "Sesión requerida.", needsLogin: true }, 401);
    }

    const limited = rateLimit(`reviews:update:${user.id}:${clientIp(request)}`, 20, 60_000);
    if (!limited.ok) {
      const r = rateLimitResponse(limited.retryAfterSec);
      return json(r.body, r.status, r.headers);
    }

    const parsed = updateReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
    }

    const {
      rating,
      opinion,
      tasteRating,
      priceRange,
      glutenCertification,
      productSlug,
    } = parsed.data;

    const { data: existing } = await supabase
      .from("reviews")
      .select("id, product_id")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return json({ ok: false, error: "Evaluación no encontrada." }, 404);
    }

    const { error } = await supabase
      .from("reviews")
      .update({
        rating,
        opinion,
        general_description: null,
        taste: null,
        taste_rating: tasteRating ?? null,
        price_range: priceRange,
        gluten_certification: glutenCertification,
      })
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) return json({ ok: false, error: error.message }, 500);

    void refreshProductAiSummary(supabase, existing.product_id).catch(() => {});

    const result = NextResponse.json({ ok: true, slug: productSlug ?? "" });
    response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
    return result;
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : "Error" },
      500
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id: reviewId } = await context.params;
  const json = (body: object, status = 200) =>
    NextResponse.json(body, { status });

  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) return json({ ok: false, error: env.error }, 500);

    if (!uuidSchema.safeParse(reviewId).success) {
      return json({ ok: false, error: "ID inválido." }, 400);
    }

    const response = NextResponse.next();
    const supabase = createClientFromRequest(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ ok: false, error: "Sesión requerida." }, 401);

    const { data: existing } = await supabase
      .from("reviews")
      .select("id, product_id")
      .eq("id", reviewId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return json({ ok: false, error: "Evaluación no encontrada." }, 404);
    }

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) return json({ ok: false, error: error.message }, 500);

    const result = NextResponse.json({ ok: true });
    response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
    return result;
  } catch (e) {
    return json(
      { ok: false, error: e instanceof Error ? e.message : "Error" },
      500
    );
  }
}
