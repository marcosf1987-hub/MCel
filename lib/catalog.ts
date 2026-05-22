import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function getOrCreateBrand(name: string) {
  const supabase = await createClient();
  const slug = slugify(name);
  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("brands")
    .insert({ name, slug })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function getOrCreateCategory(name: string) {
  const supabase = await createClient();
  const slug = slugify(name || "sin-categoria");
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: name || "Sin categoría", slug })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function getOrCreateSubcategory(
  categoryId: string,
  name: string
) {
  const supabase = await createClient();
  const slug = slugify(name || "general");
  const { data: existing } = await supabase
    .from("subcategories")
    .select("id")
    .eq("category_id", categoryId)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("subcategories")
    .insert({
      category_id: categoryId,
      name: name || "General",
      slug,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function findProductByBarcode(barcode: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, slug, name")
    .eq("barcode", barcode)
    .maybeSingle();
  return data;
}

export async function uploadProductImage(
  productId: string,
  userId: string,
  file: File,
  isOfficial = false
) {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${productId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(path);

  const { error: dbError } = await supabase.from("product_images").insert({
    product_id: productId,
    user_id: userId,
    url: publicUrl,
    is_official: isOfficial,
    sort_order: isOfficial ? 0 : 99,
  });

  if (dbError) throw dbError;
  return publicUrl;
}
