import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import {
  getOrCreateBrand,
  getOrCreateCategory,
  getOrCreateSubcategory,
} from "@/lib/catalog";
import { insertOffProductImage } from "@/lib/product-images";
import { slugify } from "@/lib/utils";

interface CreateProductPayload {
  barcode: string;
  brand: string;
  name: string;
  category: string;
  subcategory?: string;
  offImageUrl?: string;
}

export async function POST(request: NextRequest) {
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

    if (!user) {
      return json(
        { ok: false, error: "Sesión no detectada.", needsLogin: true },
        401
      );
    }

    const body = (await request.json()) as CreateProductPayload;
    const barcode = String(body.barcode ?? "").trim();
    const brandName = String(body.brand ?? "").trim();
    const productName = String(body.name ?? "").trim();
    const categoryName = String(body.category ?? "").trim();
    const subcategoryName = String(body.subcategory ?? "").trim() || "General";
    const offImageUrl = String(body.offImageUrl ?? "").trim();

    if (!barcode) return json({ ok: false, error: "Falta el código de barras." }, 400);
    if (!brandName || !productName || !categoryName) {
      return json(
        { ok: false, error: "Completá marca, nombre y categoría." },
        400
      );
    }

    const { data: existing } = await supabase
      .from("products")
      .select("id, slug")
      .eq("barcode", barcode)
      .maybeSingle();

    if (existing) {
      const result = NextResponse.json({
        ok: true,
        productId: existing.id,
        slug: existing.slug,
        alreadyExists: true,
      });
      response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
      return result;
    }

    const brandId = await getOrCreateBrand(brandName);
    const categoryId = await getOrCreateCategory(categoryName);
    const subcategoryId = await getOrCreateSubcategory(
      categoryId,
      subcategoryName
    );

    let slug = slugify(`${brandName}-${productName}`);
    const { data: slugConflict } = await supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (slugConflict) slug = `${slug}-${barcode.slice(-6)}`;

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        barcode,
        brand_id: brandId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        name: productName,
        slug,
        created_by: user.id,
      })
      .select("id, slug")
      .single();

    if (error) {
      if (error.code === "23505") {
        return json({
          ok: false,
          error:
            "Este código de barras ya está registrado. Buscá el producto para evaluarlo.",
        }, 409);
      }
      return json({ ok: false, error: error.message }, 500);
    }

    if (offImageUrl) {
      await insertOffProductImage(supabase, product.id, offImageUrl);
    }

    const result = NextResponse.json({
      ok: true,
      productId: product.id,
      slug: product.slug,
      alreadyExists: false,
    });
    response.cookies.getAll().forEach((c) => result.cookies.set(c.name, c.value));
    return result;
  } catch (e) {
    console.error("POST /api/products:", e);
    return json(
      { ok: false, error: e instanceof Error ? e.message : "Error inesperado" },
      500
    );
  }
}
