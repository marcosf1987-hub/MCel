import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/admin/audit-log";
import { bumpProductImageSortOrders } from "@/lib/product-images";

export type ImageAdminAction = "approve_cover" | "hide" | "dismiss_review";

export async function applyImageAdminAction(
  supabase: SupabaseClient,
  actorId: string,
  imageId: string,
  action: ImageAdminAction
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: image } = await supabase
    .from("product_images")
    .select("id, product_id, quality_status")
    .eq("id", imageId)
    .maybeSingle();

  if (!image) {
    return { ok: false, error: "Imagen no encontrada." };
  }

  if (action === "approve_cover") {
    await bumpProductImageSortOrders(supabase, image.product_id);

    const { error } = await supabase
      .from("product_images")
      .update({
        sort_order: 0,
        is_hidden: false,
        quality_status: "manual",
      })
      .eq("id", imageId);

    if (error) return { ok: false, error: error.message };
  } else if (action === "hide") {
    const { error } = await supabase
      .from("product_images")
      .update({
        is_hidden: true,
        quality_status: "scored",
      })
      .eq("id", imageId);

    if (error) return { ok: false, error: error.message };
  } else if (action === "dismiss_review") {
    const { error } = await supabase
      .from("product_images")
      .update({ quality_status: "scored" })
      .eq("id", imageId);

    if (error) return { ok: false, error: error.message };
  } else {
    return { ok: false, error: "Acción inválida." };
  }

  await logAdminAction(supabase, {
    actorId,
    action: `image_${action}`,
    entityType: "product_image",
    entityId: imageId,
    metadata: { product_id: image.product_id, previous_status: image.quality_status },
  });

  return { ok: true };
}
