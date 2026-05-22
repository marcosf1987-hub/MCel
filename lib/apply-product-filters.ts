import type { SupabaseClient } from "@supabase/supabase-js";
import type { GlutenCertification } from "@/types/database";

const VALID_CERTS = new Set([
  "sin_tacc",
  "sin_gluten",
  "con_trazas",
  "no_certificado",
  "desconocido",
]);

/** Filtra productos por certificación (cualquier reseña del producto) y calificación exacta (1–5). */
export async function applyCatalogFilters<T extends { id: string; weighted_rating: number | null }>(
  supabase: SupabaseClient,
  products: T[],
  cert?: string,
  rating?: string
): Promise<T[]> {
  let filtered = products;

  if (cert && VALID_CERTS.has(cert)) {
    const { data: reviewProducts } = await supabase
      .from("reviews")
      .select("product_id")
      .eq("gluten_certification", cert as GlutenCertification);
    const ids = new Set((reviewProducts ?? []).map((r) => r.product_id));
    filtered = filtered.filter((p) => ids.has(p.id));
  }

  if (rating) {
    const stars = Number(rating);
    if (stars >= 1 && stars <= 5) {
      filtered = filtered.filter((p) => {
        if (p.weighted_rating == null) return false;
        const rounded = Math.round(Number(p.weighted_rating));
        return rounded === stars;
      });
    }
  }

  return filtered;
}
