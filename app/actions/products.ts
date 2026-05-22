"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateBrand,
  getOrCreateCategory,
  getOrCreateSubcategory,
  findProductByBarcode,
  uploadProductImage,
} from "@/lib/catalog";
import { slugify } from "@/lib/utils";

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?returnUrl=/productos/nuevo");

  const barcode = String(formData.get("barcode") ?? "").trim();
  const brandName = String(formData.get("brand") ?? "").trim();
  const productName = String(formData.get("name") ?? "").trim();
  const categoryName = String(formData.get("category") ?? "").trim();
  const subcategoryName = String(formData.get("subcategory") ?? "").trim();
  const offImageUrl = String(formData.get("offImageUrl") ?? "").trim();

  if (!barcode || !brandName || !productName || !categoryName) {
    return { error: "Completá marca, categoría, subcategoría y nombre del producto." };
  }

  const existing = await findProductByBarcode(barcode);
  if (existing) {
    redirect(`/productos/${existing.slug}/evaluar`);
  }

  const brandId = await getOrCreateBrand(brandName);
  const categoryId = await getOrCreateCategory(categoryName);
  const subcategoryId = await getOrCreateSubcategory(
    categoryId,
    subcategoryName || "General"
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

  if (error) return { error: error.message };

  if (offImageUrl) {
    await supabase.from("product_images").insert({
      product_id: product.id,
      user_id: null,
      url: offImageUrl,
      is_official: true,
      sort_order: 0,
    });
  }

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    await uploadProductImage(product.id, user.id, imageFile);
  }

  redirect(`/productos/${product.slug}/evaluar`);
}

export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const productId = String(formData.get("productId"));
  const productSlug = String(formData.get("productSlug"));
  const rating = Number(formData.get("rating"));
  const opinion = String(formData.get("opinion") ?? "").trim();
  const generalDescription = String(formData.get("generalDescription") ?? "").trim();
  const taste = String(formData.get("taste") ?? "").trim() || null;
  const price = Number(formData.get("price"));
  const glutenCert = String(formData.get("glutenCertification") ?? "desconocido");

  if (!rating || rating < 1 || rating > 5) {
    return { error: "Seleccioná una puntuación del 1 al 5." };
  }
  if (!opinion || !generalDescription || !price || price < 0) {
    return { error: "Completá descripción, opinión y precio." };
  }

  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating,
    opinion,
    general_description: generalDescription,
    taste,
    price,
    gluten_certification: glutenCert,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Ya evaluaste este producto." };
    }
    return { error: error.message };
  }

  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    await uploadProductImage(productId, user.id, imageFile);
  }

  fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/products/${productId}/summary`,
    { method: "POST" }
  ).catch(() => {});

  redirect(`/productos/${productSlug}`);
}
