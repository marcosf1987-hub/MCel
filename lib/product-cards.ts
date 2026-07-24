import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductCardData } from "@/components/product/product-card";
import type { GlutenCertification } from "@/types/database";
import { visibleProductImages } from "@/lib/product-images-display";
import type { ProductRowForCard } from "@/lib/product-list-filters";

const CERT_PRIORITY: Record<GlutenCertification, number> = {
  sin_tacc: 5,
  sin_gluten: 4,
  con_trazas: 2,
  no_certificado: 1,
  desconocido: 0,
};

type ProductRowMinimal = {
  id: string;
  slug: string;
  name: string;
  weighted_rating: number | null;
  review_count: number;
  deleted_at?: string | null;
  barcode?: string | null;
  product_images?: { url: string; sort_order: number; is_hidden?: boolean }[] | null;
  brands?: ProductRowForCard["brands"];
};

export async function fetchProductCertMap(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<Map<string, GlutenCertification>> {
  if (!productIds.length) return new Map();

  const { data } = await supabase
    .from("reviews")
    .select("product_id, gluten_certification")
    .in("product_id", productIds);

  const map = new Map<string, GlutenCertification>();
  for (const row of data ?? []) {
    const cert = row.gluten_certification as GlutenCertification;
    const current = map.get(row.product_id);
    if (!current || CERT_PRIORITY[cert] > CERT_PRIORITY[current]) {
      map.set(row.product_id, cert);
    }
  }
  return map;
}

export function mapRowToProductCard(
  p: ProductRowMinimal,
  getBrandName: (brands: ProductRowMinimal["brands"]) => string | undefined,
  certMap?: Map<string, GlutenCertification>
): ProductCardData {
  const images = visibleProductImages(
    (p.product_images ?? []) as { url: string; sort_order: number; is_hidden?: boolean }[]
  );
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    weighted_rating: p.weighted_rating,
    review_count: p.review_count,
    image_url: images[0]?.url ?? null,
    brand_name: getBrandName(p.brands),
    gluten_certification: certMap?.get(p.id),
    deleted_at: p.deleted_at ?? null,
    barcode: p.barcode ?? null,
  };
}

export async function buildProductCards(
  supabase: SupabaseClient,
  products: ProductRowMinimal[],
  getBrandName: (brands: ProductRowMinimal["brands"]) => string | undefined
): Promise<ProductCardData[]> {
  const certMap = await fetchProductCertMap(
    supabase,
    products.map((p) => p.id)
  );
  return products.map((p) => mapRowToProductCard(p, getBrandName, certMap));
}
