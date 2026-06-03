import type { SupabaseClient } from "@supabase/supabase-js";

export function isOpenFoodFactsUrl(url: string): boolean {
  return /openfoodfacts/i.test(url);
}

async function countProductImages(
  supabase: SupabaseClient,
  productId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("product_images")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);

  if (error) throw error;
  return count ?? 0;
}

/** OFF solo es portada si el producto no tiene imágenes; si ya hay, va al final. */
export async function insertOffProductImage(
  supabase: SupabaseClient,
  productId: string,
  offImageUrl: string
): Promise<{ inserted: boolean; sortOrder?: number }> {
  const url = offImageUrl.trim();
  if (!url) return { inserted: false };

  const { data: duplicate } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("url", url)
    .maybeSingle();

  if (duplicate) return { inserted: false };

  const sortOrder = await countProductImages(supabase, productId);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    user_id: null,
    url,
    is_official: false,
    sort_order: sortOrder,
  });

  if (error) throw error;
  return { inserted: true, sortOrder };
}

/** Foto de comunidad siempre como portada (sort_order 0); el resto se desplaza +1. */
export async function bumpProductImageSortOrders(
  supabase: SupabaseClient,
  productId: string
): Promise<void> {
  const { data: rows, error: fetchError } = await supabase
    .from("product_images")
    .select("id, sort_order")
    .eq("product_id", productId);

  if (fetchError) throw fetchError;
  if (!rows?.length) return;

  const updates = rows.map((row) =>
    supabase
      .from("product_images")
      .update({ sort_order: row.sort_order + 1 })
      .eq("id", row.id)
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function insertCommunityProductImage(
  supabase: SupabaseClient,
  productId: string,
  userId: string,
  url: string
): Promise<void> {
  await bumpProductImageSortOrders(supabase, productId);

  const { error } = await supabase.from("product_images").insert({
    product_id: productId,
    user_id: userId,
    url,
    is_official: false,
    sort_order: 0,
  });

  if (error) throw error;
}
