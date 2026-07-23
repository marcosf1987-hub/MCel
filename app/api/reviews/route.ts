import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { GlutenCertification, PriceRange, TasteRating } from "@/types/database";

const VALID_CERTS: GlutenCertification[] = [
  "sin_tacc",
  "sin_gluten",
  "con_trazas",
  "no_certificado",
  "desconocido",
];

const VALID_PRICE_RANGES: PriceRange[] = ["1", "2", "3", "4"];
const VALID_TASTE_RATINGS: TasteRating[] = ["1", "2", "3", "4"];

/** GET = diagnóstico */
export async function GET(request: NextRequest) {
  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) {
      return NextResponse.json({
        ok: false,
        api: true,
        env: false,
        error: env.error,
      });
    }

    const diagResponse = NextResponse.json({ ok: true });
    const supabase = createClientFromRequest(request, diagResponse);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return NextResponse.json({
      ok: true,
      api: true,
      env: true,
      loggedIn: Boolean(user),
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      api: true,
      error: e instanceof Error ? e.message : "Error",
    });
  }
}

interface ReviewPayload {
  productId: string;
  productSlug: string;
  rating: number;
  opinion: string;
  tasteRating?: string | null;
  priceRange?: string | null;
  glutenCertification: string;
  skipImage?: boolean;
}

export async function POST(request: NextRequest) {
  const json = (body: object, status = 200) =>
    NextResponse.json(body, { status });

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

    const payload = (await request.json()) as ReviewPayload;

    const {
      productId,
      productSlug,
      rating,
      opinion,
    } = payload;

    let glutenCert = (payload.glutenCertification ?? "desconocido") as GlutenCertification;
    const tasteRaw = payload.tasteRating;
    const priceRaw = payload.priceRange;
    const taste =
      tasteRaw && VALID_TASTE_RATINGS.includes(tasteRaw as TasteRating)
        ? (tasteRaw as TasteRating)
        : null;
    const price =
      priceRaw && VALID_PRICE_RANGES.includes(priceRaw as PriceRange)
        ? (priceRaw as PriceRange)
        : null;

    if (!productId || !productSlug) {
      return json({ ok: false, error: "Producto no identificado." }, 400);
    }
    if (!rating || rating < 1 || rating > 5) {
      return json({ ok: false, error: "Seleccioná una puntuación del 1 al 5." }, 400);
    }
    if (!opinion?.trim()) {
      return json({ ok: false, error: "Escribí tu opinión sobre el producto." }, 400);
    }
    if (!VALID_CERTS.includes(glutenCert)) glutenCert = "desconocido";

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
      opinion: opinion.trim(),
      general_description: null,
      taste: null,
      taste_rating: taste,
      price_range: price,
      gluten_certification: glutenCert,
    });

    if (reviewError) {
      console.error("Review insert:", reviewError);
      return json({ ok: false, error: reviewError.message }, 500);
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    fetch(`${siteUrl}/api/products/${productId}/summary`, { method: "POST" }).catch(
      () => {}
    );

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
