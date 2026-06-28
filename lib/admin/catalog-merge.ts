import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/admin/audit-log";

export type MergeSummary = {
  reviewsMoved: number;
  reviewsMerged: number;
  imagesMoved: number;
  favoritesMoved: number;
  listItemsMoved: number;
};

export async function mergeProducts(
  supabase: SupabaseClient,
  actorId: string,
  sourceId: string,
  targetId: string
): Promise<
  | { ok: true; summary: MergeSummary; targetSlug: string }
  | { ok: false; error: string }
> {
  if (sourceId === targetId) {
    return { ok: false, error: "Elegí dos productos distintos." };
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, barcode, deleted_at")
    .in("id", [sourceId, targetId]);

  const source = products?.find((p) => p.id === sourceId);
  const target = products?.find((p) => p.id === targetId);

  if (!source || !target) {
    return { ok: false, error: "Uno o ambos productos no existen." };
  }
  if (target.deleted_at) {
    return {
      ok: false,
      error: "El producto destino está oculto. Restaurálo o elegí otro.",
    };
  }

  const summary: MergeSummary = {
    reviewsMoved: 0,
    reviewsMerged: 0,
    imagesMoved: 0,
    favoritesMoved: 0,
    listItemsMoved: 0,
  };

  const { data: sourceReviews } = await supabase
    .from("reviews")
    .select("id, user_id, rating, updated_at, opinion")
    .eq("product_id", sourceId);

  const { data: targetReviews } = await supabase
    .from("reviews")
    .select("id, user_id, rating, updated_at, opinion")
    .eq("product_id", targetId);

  const targetByUser = new Map(
    (targetReviews ?? []).map((r) => [r.user_id, r])
  );

  for (const review of sourceReviews ?? []) {
    const conflict = targetByUser.get(review.user_id);
    if (!conflict) {
      const { error } = await supabase
        .from("reviews")
        .update({ product_id: targetId })
        .eq("id", review.id);
      if (error) return { ok: false, error: error.message };
      summary.reviewsMoved += 1;
      continue;
    }

    const keepSource =
      review.rating > conflict.rating ||
      (review.rating === conflict.rating &&
        review.opinion.length > conflict.opinion.length);

    const loserId = keepSource ? conflict.id : review.id;
    const { error: delErr } = await supabase
      .from("reviews")
      .delete()
      .eq("id", loserId);
    if (delErr) return { ok: false, error: delErr.message };

    if (keepSource) {
      const { error } = await supabase
        .from("reviews")
        .update({ product_id: targetId })
        .eq("id", review.id);
      if (error) return { ok: false, error: error.message };
      targetByUser.set(review.user_id, review);
      summary.reviewsMoved += 1;
    }
    summary.reviewsMerged += 1;
  }

  const { data: sourceImages } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", sourceId);
  if (sourceImages?.length) {
    const { error } = await supabase
      .from("product_images")
      .update({ product_id: targetId })
      .eq("product_id", sourceId);
    if (error) return { ok: false, error: error.message };
    summary.imagesMoved = sourceImages.length;
  }

  const { data: sourceFavorites } = await supabase
    .from("favorites")
    .select("id, user_id")
    .eq("product_id", sourceId);

  const { data: targetFavUsers } = await supabase
    .from("favorites")
    .select("user_id")
    .eq("product_id", targetId);
  const targetFavSet = new Set((targetFavUsers ?? []).map((f) => f.user_id));

  for (const fav of sourceFavorites ?? []) {
    if (targetFavSet.has(fav.user_id)) {
      await supabase.from("favorites").delete().eq("id", fav.id);
    } else {
      const { error } = await supabase
        .from("favorites")
        .update({ product_id: targetId })
        .eq("id", fav.id);
      if (error) return { ok: false, error: error.message };
      targetFavSet.add(fav.user_id);
      summary.favoritesMoved += 1;
    }
  }

  const { data: sourceItems } = await supabase
    .from("product_list_items")
    .select("id, list_id")
    .eq("product_id", sourceId);

  const { data: targetItems } = await supabase
    .from("product_list_items")
    .select("list_id")
    .eq("product_id", targetId);
  const targetListSet = new Set((targetItems ?? []).map((i) => i.list_id));

  for (const item of sourceItems ?? []) {
    if (targetListSet.has(item.list_id)) {
      await supabase.from("product_list_items").delete().eq("id", item.id);
    } else {
      const { error } = await supabase
        .from("product_list_items")
        .update({ product_id: targetId })
        .eq("id", item.id);
      if (error) return { ok: false, error: error.message };
      targetListSet.add(item.list_id);
      summary.listItemsMoved += 1;
    }
  }

  const now = new Date().toISOString();
  const freedBarcode = `merged-${source.id.slice(0, 8)}-${source.barcode}`.slice(
    0,
    120
  );
  const freedSlug = `merged-${source.id.slice(0, 8)}-${source.slug}`.slice(
    0,
    200
  );

  const { error: sourceErr } = await supabase
    .from("products")
    .update({
      deleted_at: now,
      barcode: freedBarcode,
      slug: freedSlug,
    })
    .eq("id", sourceId);

  if (sourceErr) return { ok: false, error: sourceErr.message };

  const { error: ratingErr } = await supabase.rpc("recalculate_product_rating", {
    p_product_id: targetId,
  });
  if (ratingErr) {
    console.error("recalculate_product_rating:", ratingErr);
  }

  await logAdminAction(supabase, {
    actorId,
    action: "merge_products",
    entityType: "product",
    entityId: targetId,
    metadata: {
      source_id: sourceId,
      source_name: source.name,
      target_name: target.name,
      summary,
    },
  });

  return { ok: true, summary, targetSlug: target.slug };
}
