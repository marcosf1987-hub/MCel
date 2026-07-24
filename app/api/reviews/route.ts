import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { refreshProductAiSummary } from "@/lib/ai/refresh-product-summary";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  createReviewSchema,
  zodErrorMessage,
} from "@/lib/validation/api-schemas";

/** GET: sin diagnóstico. */
export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const json = (body: object, status = 200, headers?: HeadersInit) =>
    NextResponse.json(body, { status, headers });

  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) {
      return json({ ok: false, error: env.error }, 500);
    }

    const response = NextResponse.next();
    const supabase = createClientFromRequest(request, response);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return json(
        {
          ok: false,
          error: "Sesión no detectada. Cerrá sesión y volvé a entrar.",
          needsLogin: true,
        },
        401
      );
    }

    const limited = rateLimit(`reviews:create:${user.id}:${clientIp(request)}`, 10, 60_000);
    if (!limited.ok) {
      const r = rateLimitResponse(limited.retryAfterSec);
      return json(r.body, r.status, r.headers);
    }

    const parsed = createReviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
    }

    const {
      productId,
      productSlug,
      rating,
      opinion,
      tasteRating,
      priceRange,
      glutenCertification,
    } = parsed.data;

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReview) {
      return json({ ok: false, error: "Ya evaluaste este producto." }, 409);
    }

    const { error: reviewError } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      opinion,
      general_description: null,
      taste: null,
      taste_rating: tasteRating ?? null,
      price_range: priceRange,
      gluten_certification: glutenCertification,
    });

    if (reviewError) {
      console.error("Review insert:", reviewError);
      return json({ ok: false, error: reviewError.message }, 500);
    }

    void refreshProductAiSummary(supabase, productId).catch(() => {});

    const result = NextResponse.json({
      ok: true,
      slug: productSlug,
    });
    response.cookies.getAll().forEach((c) => {
      result.cookies.set(c.name, c.value);
    });
    return result;
  } catch (e) {
    console.error("POST /api/reviews:", e);
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return json({ ok: false, error: msg }, 500);
  }
}
