import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/route-handler";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { getOrCreateBrand } from "@/lib/catalog";
import { validateCategoryPair } from "@/lib/catalog/validate-category";
import { insertOffProductImage } from "@/lib/product-images";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  createProductSchema,
  zodErrorMessage,
} from "@/lib/validation/api-schemas";
import { slugify } from "@/lib/utils";

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
        { ok: false, error: "Sesión no detectada.", needsLogin: true },
        401
      );
    }

    const limited = rateLimit(`products:create:${user.id}:${clientIp(request)}`, 8, 10 * 60_000);
    if (!limited.ok) {
      const r = rateLimitResponse(limited.retryAfterSec);
      return json(r.body, r.status, r.headers);
    }

    const parsed = createProductSchema.safeParse(await request.json());
    if (!parsed.success) {
      return json({ ok: false, error: zodErrorMessage(parsed.error) }, 400);
    }

    const {
      barcode,
      brand: brandName,
      name: productName,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      offImageUrl,
    } = parsed.data;

    const categoryCheck = await validateCategoryPair(
      supabase,
      categoryId,
      subcategoryId
    );
    if (!categoryCheck.ok) {
      return json({ ok: false, error: categoryCheck.error }, 400);
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
        return json(
          {
            ok: false,
            error:
              "Este código de barras ya está registrado. Buscá el producto para evaluarlo.",
          },
          409
        );
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
