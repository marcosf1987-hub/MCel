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
  const json = (body: object, status = 200) =>
    NextResponse.json(body, { status });

  try {
    const env = getSupabasePublicEnv();
    if (!env.ok) return json({ ok: false, error: env.error }, 500);

    const response = NextResponse.next();
    const supabase = createClientFromRequest(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ ok: false, error: "Sesión requerida.", needsLogin: true }, 401);

    const body = await request.json();
    const rating = Number(body.rating);
    const opinion = String(body.opinion ?? "").trim();
    const generalDescription = String(body.generalDescription ?? "").trim();
    const taste = String(body.taste ?? "").trim() || null;
    const price = Number(body.price);
    let glutenCert = (body.glutenCertification ?? "desconocido") as GlutenCertification;
    const productSlug = String(body.productSlug ?? "");

    if (!rating || rating < 1 || rating > 5) {
      return json({ ok: false, error: "Puntuación inválida." }, 400);
    }
    if (!opinion || !generalDescription) {
      return json({ ok: false, error: "Completá descripción y opinión." }, 400);
    }
    if (Number.isNaN(price) || price < 0) {
      return json({ ok: false, error: "Precio inválido." }, 400);
    }
    if (!VALID_CERTS.includes(glutenCert)) glutenCert = "desconocido";

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
        general_description: generalDescription,
        taste,
        price,
        gluten_certification: glutenCert,
      })
      .eq("id", reviewId)
      .eq("user_id", user.id);

    if (error) return json({ ok: false, error: error.message }, 500);

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    fetch(`${siteUrl}/api/products/${existing.product_id}/summary`, {
      method: "POST",
    }).catch(() => {});

    const result = NextResponse.json({ ok: true, slug: productSlug });
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
