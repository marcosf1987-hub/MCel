import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { GlutenCertification } from "@/types/database";

const VALID_CERTS: GlutenCertification[] = [
  "sin_tacc",
  "sin_gluten",
  "con_trazas",
  "no_certificado",
  "desconocido",
];

/** GET = diagnóstico: ¿estás logueado? ¿existe la API? */
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

async function uploadImageAdmin(
  productId: string,
  userId: string,
  file: File
): Promise<string> {
  const admin = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${productId}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(path, buffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = admin.storage.from("product-images").getPublicUrl(path);

  const { error: dbError } = await admin.from("product_images").insert({
    product_id: productId,
    user_id: userId,
    url: publicUrl,
    is_official: false,
    sort_order: 99,
  });

  if (dbError) throw dbError;
  return publicUrl;
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
        { ok: false, error: "Sesión no detectada. Cerrá sesión y volvé a entrar.", needsLogin: true },
        401
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return json({ ok: false, error: "No se pudo leer el formulario enviado." }, 400);
    }

    const productId = String(formData.get("productId") ?? "");
    const productSlug = String(formData.get("productSlug") ?? "");
    const rating = Number(formData.get("rating"));
    const opinion = String(formData.get("opinion") ?? "").trim();
    const generalDescription = String(formData.get("generalDescription") ?? "").trim();
    const taste = String(formData.get("taste") ?? "").trim() || null;
    const price = Number(formData.get("price"));
    let glutenCert = String(
      formData.get("glutenCertification") ?? "desconocido"
    ) as GlutenCertification;
    const imageFile = formData.get("image");
    const skipImage = formData.get("skipImage") === "true";

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

    const hasFile = imageFile instanceof File && imageFile.size > 0;
    if (!hasFile && !skipImage) {
      return json({ ok: false, error: "Subí una foto del producto." }, 400);
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
      taste,
      price,
      gluten_certification: glutenCert,
    });

    if (reviewError) {
      console.error("Review insert:", reviewError);
      return json({ ok: false, error: reviewError.message }, 500);
    }

    let imageWarning: string | null = null;

    if (hasFile && imageFile instanceof File) {
      try {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          await uploadImageAdmin(productId, user.id, imageFile);
        } else {
          const { uploadProductImage } = await import("@/lib/catalog");
          await uploadProductImage(productId, user.id, imageFile);
        }
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error ? uploadErr.message : "Error de storage";
        imageWarning = `Evaluación guardada. Foto no subida: ${msg}. Creá el bucket product-images en Supabase.`;
        console.error("Upload:", uploadErr);
      }
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
      warning: imageWarning,
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
