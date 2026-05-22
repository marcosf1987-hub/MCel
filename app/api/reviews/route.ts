import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadProductImage } from "@/lib/catalog";
import type { GlutenCertification } from "@/types/database";

const VALID_CERTS: GlutenCertification[] = [
  "sin_tacc",
  "sin_gluten",
  "con_trazas",
  "no_certificado",
  "desconocido",
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Tenés que iniciar sesión.", needsLogin: true },
        { status: 401 }
      );
    }

    const formData = await request.formData();

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
      return NextResponse.json(
        { ok: false, error: "Producto no identificado." },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { ok: false, error: "Seleccioná una puntuación del 1 al 5." },
        { status: 400 }
      );
    }

    if (!opinion || !generalDescription) {
      return NextResponse.json(
        { ok: false, error: "Completá la descripción general y tu opinión." },
        { status: 400 }
      );
    }

    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { ok: false, error: "Ingresá un precio válido (número ≥ 0)." },
        { status: 400 }
      );
    }

    if (!VALID_CERTS.includes(glutenCert)) {
      glutenCert = "desconocido";
    }

    const hasFile =
      imageFile instanceof File && imageFile.size > 0;

    if (!hasFile && !skipImage) {
      return NextResponse.json(
        { ok: false, error: "Subí una foto del producto." },
        { status: 400 }
      );
    }

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { ok: false, error: "Ya publicaste una evaluación de este producto." },
        { status: 409 }
      );
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
      console.error("Review insert error:", reviewError);
      return NextResponse.json(
        { ok: false, error: reviewError.message },
        { status: 500 }
      );
    }

    let imageWarning: string | null = null;

    if (hasFile && imageFile instanceof File) {
      try {
        await uploadProductImage(productId, user.id, imageFile);
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error ? uploadErr.message : "Error al subir imagen";
        imageWarning = `Evaluación guardada. La foto no se pudo subir: ${msg}`;
        console.error("Image upload error:", uploadErr);
      }
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    fetch(`${siteUrl}/api/products/${productId}/summary`, {
      method: "POST",
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      slug: productSlug,
      warning: imageWarning,
    });
  } catch (e) {
    console.error("POST /api/reviews:", e);
    const msg = e instanceof Error ? e.message : "Error inesperado";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
