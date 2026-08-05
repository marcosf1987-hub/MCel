import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreImageHeuristic } from "@/lib/ai/image-quality-heuristic";
import { scoreImagesVision } from "@/lib/ai/image-quality-vision";
import type { ImageSource, ProductImageQualityDetails } from "@/types/database";

export const OFF_HIDE_THRESHOLD = 40;
export const VISION_POOL_MAX = 10;
export const HEURISTIC_OUTSIDER_PROMOTE = 3;

export type RankableImage = {
  id: string;
  url: string;
  sort_order: number;
  image_source: ImageSource;
  quality_status: string;
  created_at: string;
};

const SOURCE_PRIORITY: Record<ImageSource, number> = {
  official: 3,
  community: 2,
  off: 1,
};

function isUnloadable(details: ProductImageQualityDetails | undefined, score: number) {
  if (score <= 0) return true;
  return Boolean(details?.issues?.includes("no_se_pudo_cargar"));
}

function compareRank(
  a: {
    score: number;
    image_source: ImageSource;
    created_at: string;
    details?: ProductImageQualityDetails;
  },
  b: {
    score: number;
    image_source: ImageSource;
    created_at: string;
    details?: ProductImageQualityDetails;
  }
) {
  const aBroken = isUnloadable(a.details, a.score);
  const bBroken = isUnloadable(b.details, b.score);
  if (aBroken !== bBroken) return aBroken ? 1 : -1;

  // Preferir community/official sobre OFF para la portada
  const aOff = a.image_source === "off" ? 1 : 0;
  const bOff = b.image_source === "off" ? 1 : 0;
  if (aOff !== bOff) return aOff - bOff;

  if (b.score !== a.score) return b.score - a.score;
  if (SOURCE_PRIORITY[b.image_source] !== SOURCE_PRIORITY[a.image_source]) {
    return SOURCE_PRIORITY[b.image_source] - SOURCE_PRIORITY[a.image_source];
  }
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

async function buildVisionPool(images: RankableImage[]): Promise<RankableImage[]> {
  if (images.length <= VISION_POOL_MAX) return images;

  const byOrder = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const topByOrder = byOrder.slice(0, VISION_POOL_MAX);
  const pending = images.filter((i) => i.quality_status === "pending");
  const outsideTop = byOrder.slice(VISION_POOL_MAX);

  const promoted: RankableImage[] = [];
  if (outsideTop.length) {
    const scored = await Promise.all(
      outsideTop.map(async (img) => ({
        img,
        score: (await scoreImageHeuristic(img.url)).overall_score,
      }))
    );
    promoted.push(
      ...scored
        .sort((a, b) => b.score - a.score)
        .slice(0, HEURISTIC_OUTSIDER_PROMOTE)
        .map((s) => s.img)
    );
  }

  const pool: RankableImage[] = [];
  const seen = new Set<string>();
  for (const img of [...pending, ...topByOrder, ...promoted]) {
    if (seen.has(img.id)) continue;
    seen.add(img.id);
    pool.push(img);
    if (pool.length >= VISION_POOL_MAX) break;
  }
  return pool;
}

export async function rankProductImages(
  supabase: SupabaseClient,
  productId: string
): Promise<{ ok: boolean; ranked: number; error?: string }> {
  const { data: allRows, error } = await supabase
    .from("product_images")
    .select("id, url, sort_order, image_source, quality_status, created_at, is_hidden")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) return { ok: false, ranked: 0, error: error.message };
  if (!allRows?.length) return { ok: true, ranked: 0 };

  const manualVisible = allRows.filter(
    (r) => r.quality_status === "manual" && r.is_hidden !== true
  );
  const images = allRows.filter(
    (r) => r.quality_status !== "manual"
  ) as RankableImage[];

  if (!images.length) return { ok: true, ranked: 0 };

  const visionPool = await buildVisionPool(images);
  const poolIds = new Set(visionPool.map((i) => i.id));

  const scoreMap = new Map<
    string,
    { overall_score: number; details: ProductImageQualityDetails }
  >();

  const visionResults = await scoreImagesVision(
    visionPool.map((i) => ({ id: i.id, url: i.url }))
  );

  if (visionResults) {
    for (const r of visionResults) {
      scoreMap.set(r.image_id, {
        overall_score: r.overall_score,
        details: r.details,
      });
    }
  }

  for (const img of visionPool) {
    if (scoreMap.has(img.id)) continue;
    const h = await scoreImageHeuristic(img.url);
    scoreMap.set(img.id, { overall_score: h.overall_score, details: h.details });
  }

  for (const img of images) {
    if (poolIds.has(img.id)) continue;
    const h = await scoreImageHeuristic(img.url);
    scoreMap.set(img.id, { overall_score: h.overall_score, details: h.details });
  }

  const ranked = images
    .map((img) => {
      const s = scoreMap.get(img.id)!;
      return { ...img, score: s.overall_score, details: s.details };
    })
    .sort(compareRank);

  const hideCandidates = new Map<string, (typeof ranked)[number]>();
  const loadableAuto = ranked.filter((img) => !isUnloadable(img.details, img.score));
  const hasAlternative =
    loadableAuto.some((img) => img.image_source !== "off") ||
    manualVisible.some((img) => img.image_source !== "off") ||
    loadableAuto.length + manualVisible.length > 1;

  // URLs rotas: ocultar si hay alternativa cargable (auto o manual)
  if (loadableAuto.length + manualVisible.length > 0) {
    for (const img of ranked) {
      if (isUnloadable(img.details, img.score)) hideCandidates.set(img.id, img);
    }
  }

  // OFF flojas: ocultar si hay otra imagen usable
  for (const img of ranked) {
    if (img.image_source !== "off") continue;
    if (img.score >= OFF_HIDE_THRESHOLD && !isUnloadable(img.details, img.score)) {
      continue;
    }
    if (hasAlternative || loadableAuto.length + manualVisible.length > 1) {
      hideCandidates.set(img.id, img);
    }
  }

  // Si preferimos no-OFF y hay community/official visible, demorar OFF buenas
  // no hace falta ocultarlas: el sort las pone después. Ocultar solo flojas/rotas.

  const wouldRemain =
    ranked.length - hideCandidates.size + manualVisible.length;
  if (wouldRemain < 1) {
    hideCandidates.clear();
  }

  const hiddenIds = new Set(hideCandidates.keys());
  const visibleRanked = ranked.filter((img) => !hiddenIds.has(img.id));

  const now = new Date().toISOString();
  let needsReview = false;
  if (
    visibleRanked.length + manualVisible.length === 1 &&
    visibleRanked[0] &&
    (visibleRanked[0].score < OFF_HIDE_THRESHOLD ||
      isUnloadable(visibleRanked[0].details, visibleRanked[0].score))
  ) {
    needsReview = true;
  }

  // Orden final: portadas manuales primero (0..n-1), luego automáticas.
  // Así una OFF no queda delante de community/official elegidas a mano.
  const manualsOrdered = [...manualVisible].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  for (let i = 0; i < manualsOrdered.length; i++) {
    const { error: upErr } = await supabase
      .from("product_images")
      .update({ sort_order: i })
      .eq("id", manualsOrdered[i].id);
    if (upErr) return { ok: false, ranked: 0, error: upErr.message };
  }

  const orderOffset = manualsOrdered.length;

  let order = orderOffset;
  for (const img of visibleRanked) {
    const status = needsReview && order === orderOffset ? "needs_review" : "scored";
    const { error: upErr } = await supabase
      .from("product_images")
      .update({
        sort_order: order,
        quality_score: img.score,
        quality_details: img.details,
        quality_status: status,
        is_hidden: false,
        scored_at: now,
      })
      .eq("id", img.id);
    if (upErr) return { ok: false, ranked: 0, error: upErr.message };
    order++;
  }

  for (const img of hideCandidates.values()) {
    const { error: upErr } = await supabase
      .from("product_images")
      .update({
        quality_score: img.score,
        quality_details: img.details,
        quality_status: "scored",
        is_hidden: true,
        scored_at: now,
      })
      .eq("id", img.id);
    if (upErr) return { ok: false, ranked: 0, error: upErr.message };
  }

  return { ok: true, ranked: images.length };
}

export async function getProductIdsForRanking(
  supabase: SupabaseClient,
  limit = 100
): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("product_id")
    .neq("quality_status", "manual")
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) throw error;

  const ids = [...new Set((data ?? []).map((r) => r.product_id as string))];
  return ids.slice(0, limit);
}
