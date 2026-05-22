import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { GlutenCertification } from "@/types/database";

const VALID_CERTS: GlutenCertification[] = [
  "sin_tacc",
  "sin_gluten",
  "con_trazas",
  "no_certificado",
  "desconocido",
];

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
      userId: user?.id ?? null,
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
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
  generalDescription: string;
  taste?: string;
  price: number;
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

    const contentType = request.headers.get("content-type") ?? "";
    let payload: ReviewPayload;

    if (contentType.includes("application/json")) {
      payload = (await request.json()) as ReviewPayload;
    } else {
      // FormData legacy (sin archivo grande)
      const formData = await request.formData();
      payload = {
        productId: String(formData.get("productId") ?? ""),
        productSlug: String(formData.get("productSlug") ?? ""),
        rating: Number(formData.get("rating")),
        opinion: String(formData.get("opinion") ?? "").trim(),
        generalDescription: String(formData.get("generalDescription") ?? "").trim(),
        taste: String(formData.get("taste") ?? "").trim(),
        price: Number(formData.get("price")),
        glutenCertification: String(formData.get("glutenCertification") ?? "desconocido"),
        skipImage: formData.get("skipImage") === "true",
      };
    }

    const {
      productId,
      productSlug,
      rating,
      opinion,
      generalDescription,
      taste,
      price,
    } = payload;

    let glutenCert = (payload.glutenCertification ?? "desconocido") as GlutenCertification;
    const skipImage = payload.skipImage === true;

    if (!productId || !productSlug) {
      return json({ ok: false, error: "Producto no identificado." }, 400);
    }
    if (!rating || rating < 1 || rating > 5) {
      return json({ ok: false, error: "Seleccioná una puntuación del 1 al 5." }, 400);
    }
    if (!opinion || !generalDescription) {
      return json({ ok: false, error: "Completá la descripción y tu opinión." }, 400);
    }
    if (Number.isNaN(price) || price < 0) {
      return json({ ok: false, error: "Ingresá un precio válido." }, 400);
    }
    if (!VALID_CERTS.includes(glutenCert)) glutenCert = "desconocido";

    if (!skipImage) {
      const { count } = await supabase
        .from("product_images")
        .select("*", { count: "exact", head: true })
        .eq("product_id", productId);
      if ((count ?? 0) === 0) {
        return json({
          ok: false,
          error: "Subí una foto del producto (la imagen debe subirse antes de publicar).",
        }, 400);
      }
    }

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
      general_description: generalDescription,
      taste: taste || null,
      price,
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
