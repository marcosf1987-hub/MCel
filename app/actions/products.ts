"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateBrand,
  findProductByBarcode,
  uploadProductImage,
} from "@/lib/catalog";
import { validateCategoryPair } from "@/lib/catalog/validate-category";
import { insertOffProductImage } from "@/lib/product-images";
import { slugify } from "@/lib/utils";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; needsLogin?: boolean };

export async function createProduct(formData: FormData): Promise<
  ActionResult<{ slug: string }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Tenés que iniciar sesión.", needsLogin: true };
    }

    const barcode = String(formData.get("barcode") ?? "").trim();
    const brandName = String(formData.get("brand") ?? "").trim();
    const productName = String(formData.get("name") ?? "").trim();
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const subcategoryId = String(formData.get("subcategory_id") ?? "").trim();
    const offImageUrl = String(formData.get("offImageUrl") ?? "").trim();
    const imageFile = formData.get("image") as File | null;
    const hasFile = imageFile && imageFile.size > 0;

    if (!barcode) {
      return { ok: false, error: "Falta el código de barras." };
    }
    if (!brandName || !productName) {
      return {
        ok: false,
        error: "Completá marca, nombre y clasificación.",
      };
    }
    if (!hasFile && !offImageUrl) {
      return {
        ok: false,
        error: "Subí una foto del producto o escaneá uno que tenga imagen en Open Food Facts.",
      };
    }

    const existing = await findProductByBarcode(barcode);
    if (existing) {
      return { ok: true, data: { slug: existing.slug } };
    }

    const categoryCheck = await validateCategoryPair(
      supabase,
      categoryId,
      subcategoryId
    );
    if (!categoryCheck.ok) {
      return { ok: false, error: categoryCheck.error };
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
        return {
          ok: false,
          error: "Este código de barras ya está registrado. Buscá el producto para evaluarlo.",
        };
      }
      return { ok: false, error: error.message };
    }

    if (offImageUrl) {
      try {
        await insertOffProductImage(supabase, product.id, offImageUrl);
      } catch (imgErr) {
        console.error("OFF image insert:", imgErr);
      }
    }

    if (hasFile && imageFile) {
      try {
        await uploadProductImage(product.id, user.id, imageFile);
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error ? uploadErr.message : "Error al subir imagen";
        return {
          ok: false,
          error: `Producto creado pero falló la imagen: ${msg}. Podés agregarla en la evaluación.`,
        };
      }
    }

    return { ok: true, data: { slug: product.slug } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    console.error("createProduct:", e);
    return { ok: false, error: msg };
  }
}

export async function submitReview(formData: FormData): Promise<
  ActionResult<{ slug: string }>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Tenés que iniciar sesión.", needsLogin: true };
    }

    const productId = String(formData.get("productId"));
    const productSlug = String(formData.get("productSlug"));
    const rating = Number(formData.get("rating"));
    const opinion = String(formData.get("opinion") ?? "").trim();
    const tasteRating = String(formData.get("tasteRating") ?? "");
    const priceRange = String(formData.get("priceRange") ?? "");
    const glutenCert = String(formData.get("glutenCertification") ?? "desconocido");
    const validRanges = ["1", "2", "3", "4"];
    const validTaste = ["1", "2", "3", "4"];

    if (!rating || rating < 1 || rating > 5) {
      return { ok: false, error: "Seleccioná una puntuación del 1 al 5." };
    }
    if (!opinion) {
      return { ok: false, error: "Escribí tu opinión." };
    }
    if (!validTaste.includes(tasteRating)) {
      return { ok: false, error: "Seleccioná cómo te pareció el sabor." };
    }
    if (!validRanges.includes(priceRange)) {
      return { ok: false, error: "Seleccioná un rango de precio." };
    }

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      opinion,
      general_description: null,
      taste: null,
      taste_rating: tasteRating,
      price_range: priceRange,
      gluten_certification: glutenCert,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "Ya evaluaste este producto." };
      }
      return { ok: false, error: error.message };
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    fetch(`${siteUrl}/api/products/${productId}/summary`, {
      method: "POST",
    }).catch(() => {});

    return { ok: true, data: { slug: productSlug } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error inesperado";
    console.error("submitReview:", e);
    return { ok: false, error: msg };
  }
}
